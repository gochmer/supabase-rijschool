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
      instructeur_inkomsten_transacties: {
        Row: {
          bedrag: number
          betaald_at: string | null
          betaling_id: string | null
          btw_bedrag: number
          created_at: string
          factuurnummer: string | null
          herinnering_verstuurd_at: string | null
          id: string
          instructeur_id: string
          leerling_id: string | null
          les_id: string | null
          metadata: Json
          netto_bedrag: number | null
          omschrijving: string
          pakket_id: string | null
          platform_fee: number
          status: string
          type: string
          updated_at: string
          vervaldatum: string | null
        }
        Insert: {
          bedrag?: number
          betaald_at?: string | null
          betaling_id?: string | null
          btw_bedrag?: number
          created_at?: string
          factuurnummer?: string | null
          herinnering_verstuurd_at?: string | null
          id?: string
          instructeur_id: string
          leerling_id?: string | null
          les_id?: string | null
          metadata?: Json
          netto_bedrag?: number | null
          omschrijving?: string
          pakket_id?: string | null
          platform_fee?: number
          status?: string
          type?: string
          updated_at?: string
          vervaldatum?: string | null
        }
        Update: {
          bedrag?: number
          betaald_at?: string | null
          betaling_id?: string | null
          btw_bedrag?: number
          created_at?: string
          factuurnummer?: string | null
          herinnering_verstuurd_at?: string | null
          id?: string
          instructeur_id?: string
          leerling_id?: string | null
          les_id?: string | null
          metadata?: Json
          netto_bedrag?: number | null
          omschrijving?: string
          pakket_id?: string | null
          platform_fee?: number
          status?: string
          type?: string
          updated_at?: string
          vervaldatum?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instructeur_inkomsten_transacties_betaling_id_fkey"
            columns: ["betaling_id"]
            isOneToOne: false
            referencedRelation: "betalingen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructeur_inkomsten_transacties_instructeur_id_fkey"
            columns: ["instructeur_id"]
            isOneToOne: false
            referencedRelation: "instructeurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructeur_inkomsten_transacties_leerling_id_fkey"
            columns: ["leerling_id"]
            isOneToOne: false
            referencedRelation: "leerlingen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructeur_inkomsten_transacties_les_id_fkey"
            columns: ["les_id"]
            isOneToOne: false
            referencedRelation: "lessen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructeur_inkomsten_transacties_pakket_id_fkey"
            columns: ["pakket_id"]
            isOneToOne: false
            referencedRelation: "pakketten"
            referencedColumns: ["id"]
          },
        ]
      }
      instructeur_kostenbonnen: {
        Row: {
          bedrag: number
          bestand_grootte: number | null
          bestand_naam: string | null
          bestand_pad: string | null
          bestand_type: string | null
          btw_bedrag: number
          categorie: string
          created_at: string
          id: string
          instructeur_id: string
          leverancier: string | null
          metadata: Json
          omschrijving: string
          uitgegeven_op: string
          updated_at: string
        }
        Insert: {
          bedrag?: number
          bestand_grootte?: number | null
          bestand_naam?: string | null
          bestand_pad?: string | null
          bestand_type?: string | null
          btw_bedrag?: number
          categorie?: string
          created_at?: string
          id?: string
          instructeur_id: string
          leverancier?: string | null
          metadata?: Json
          omschrijving?: string
          uitgegeven_op?: string
          updated_at?: string
        }
        Update: {
          bedrag?: number
          bestand_grootte?: number | null
          bestand_naam?: string | null
          bestand_pad?: string | null
          bestand_type?: string | null
          btw_bedrag?: number
          categorie?: string
          created_at?: string
          id?: string
          instructeur_id?: string
          leverancier?: string | null
          metadata?: Json
          omschrijving?: string
          uitgegeven_op?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructeur_kostenbonnen_instructeur_id_fkey"
            columns: ["instructeur_id"]
            isOneToOne: false
            referencedRelation: "instructeurs"
            referencedColumns: ["id"]
          },
        ]
      }
      instructeur_leerling_koppelingen: {
        Row: {
          bron: string
          created_at: string
          id: string
          instructeur_id: string
          intake_checklist_keys: string[]
          leerling_id: string
          onboarding_notitie: string | null
          updated_at: string
        }
        Insert: {
          bron?: string
          created_at?: string
          id?: string
          instructeur_id: string
          intake_checklist_keys?: string[]
          leerling_id: string
          onboarding_notitie?: string | null
          updated_at?: string
        }
        Update: {
          bron?: string
          created_at?: string
          id?: string
          instructeur_id?: string
          intake_checklist_keys?: string[]
          leerling_id?: string
          onboarding_notitie?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructeur_leerling_koppelingen_instructeur_id_fkey"
            columns: ["instructeur_id"]
            isOneToOne: false
            referencedRelation: "instructeurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructeur_leerling_koppelingen_leerling_id_fkey"
            columns: ["leerling_id"]
            isOneToOne: false
            referencedRelation: "leerlingen"
            referencedColumns: ["id"]
          },
        ]
      }
      instructeur_uitbetalingen: {
        Row: {
          bruto_bedrag: number
          created_at: string
          id: string
          instructeur_id: string
          netto_bedrag: number | null
          periode_eind: string
          periode_start: string
          platform_fee: number
          referentie: string | null
          status: string
          uitbetaald_at: string | null
          updated_at: string
        }
        Insert: {
          bruto_bedrag?: number
          created_at?: string
          id?: string
          instructeur_id: string
          netto_bedrag?: number | null
          periode_eind: string
          periode_start: string
          platform_fee?: number
          referentie?: string | null
          status?: string
          uitbetaald_at?: string | null
          updated_at?: string
        }
        Update: {
          bruto_bedrag?: number
          created_at?: string
          id?: string
          instructeur_id?: string
          netto_bedrag?: number | null
          periode_eind?: string
          periode_start?: string
          platform_fee?: number
          referentie?: string | null
          status?: string
          uitbetaald_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructeur_uitbetalingen_instructeur_id_fkey"
            columns: ["instructeur_id"]
            isOneToOne: false
            referencedRelation: "instructeurs"
            referencedColumns: ["id"]
          },
        ]
      }
      instructeur_verificatie_aanvragen: {
        Row: {
          functie_rol: string | null
          id: string
          instructeur_id: string
          rijschool_organisatie: string | null
          specialisaties: string[]
          status: string
          submitted_at: string
          updated_at: string
          wrm_categorie: string
          wrm_geldig_tot: string
          wrm_pasnummer: string
        }
        Insert: {
          functie_rol?: string | null
          id?: string
          instructeur_id: string
          rijschool_organisatie?: string | null
          specialisaties?: string[]
          status?: string
          submitted_at?: string
          updated_at?: string
          wrm_categorie: string
          wrm_geldig_tot: string
          wrm_pasnummer: string
        }
        Update: {
          functie_rol?: string | null
          id?: string
          instructeur_id?: string
          rijschool_organisatie?: string | null
          specialisaties?: string[]
          status?: string
          submitted_at?: string
          updated_at?: string
          wrm_categorie?: string
          wrm_geldig_tot?: string
          wrm_pasnummer?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructeur_verificatie_aanvragen_instructeur_id_fkey"
            columns: ["instructeur_id"]
            isOneToOne: true
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
          leerling_annuleren_tot_uren_voor_les: number | null
          online_boeken_actief: boolean
          prijs_per_les: number
          profiel_compleetheid: number
          profiel_status: string
          profielfoto_kleur: string
          profile_id: string
          slug: string
          specialisaties: string[]
          standaard_examenrit_duur_minuten: number
          standaard_pakketles_duur_minuten: number
          standaard_proefles_duur_minuten: number
          standaard_rijles_duur_minuten: number
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
          leerling_annuleren_tot_uren_voor_les?: number | null
          online_boeken_actief?: boolean
          prijs_per_les?: number
          profiel_compleetheid?: number
          profiel_status?: string
          profielfoto_kleur?: string
          profile_id: string
          slug: string
          specialisaties?: string[]
          standaard_examenrit_duur_minuten?: number
          standaard_pakketles_duur_minuten?: number
          standaard_proefles_duur_minuten?: number
          standaard_rijles_duur_minuten?: number
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
          leerling_annuleren_tot_uren_voor_les?: number | null
          online_boeken_actief?: boolean
          prijs_per_les?: number
          profiel_compleetheid?: number
          profiel_status?: string
          profielfoto_kleur?: string
          profile_id?: string
          slug?: string
          specialisaties?: string[]
          standaard_examenrit_duur_minuten?: number
          standaard_pakketles_duur_minuten?: number
          standaard_proefles_duur_minuten?: number
          standaard_rijles_duur_minuten?: number
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
      leerling_documenten: {
        Row: {
          bestand_grootte: number | null
          bestand_naam: string | null
          bestand_pad: string
          bestand_type: string | null
          created_at: string
          document_type: string
          id: string
          leerling_id: string | null
          naam: string
          profiel_id: string
          status: string
          updated_at: string
        }
        Insert: {
          bestand_grootte?: number | null
          bestand_naam?: string | null
          bestand_pad: string
          bestand_type?: string | null
          created_at?: string
          document_type?: string
          id?: string
          leerling_id?: string | null
          naam: string
          profiel_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          bestand_grootte?: number | null
          bestand_naam?: string | null
          bestand_pad?: string
          bestand_type?: string | null
          created_at?: string
          document_type?: string
          id?: string
          leerling_id?: string | null
          naam?: string
          profiel_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leerling_documenten_leerling_id_fkey"
            columns: ["leerling_id"]
            isOneToOne: false
            referencedRelation: "leerlingen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leerling_documenten_profiel_id_fkey"
            columns: ["profiel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leerling_leervoorkeuren: {
        Row: {
          begeleiding: string
          created_at: string
          leerling_id: string | null
          leerstijl: string
          oefenritme: string
          profiel_id: string
          scenario_focus: string[]
          spanningsniveau: string
          updated_at: string
        }
        Insert: {
          begeleiding?: string
          created_at?: string
          leerling_id?: string | null
          leerstijl?: string
          oefenritme?: string
          profiel_id: string
          scenario_focus?: string[]
          spanningsniveau?: string
          updated_at?: string
        }
        Update: {
          begeleiding?: string
          created_at?: string
          leerling_id?: string | null
          leerstijl?: string
          oefenritme?: string
          profiel_id?: string
          scenario_focus?: string[]
          spanningsniveau?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leerling_leervoorkeuren_leerling_id_fkey"
            columns: ["leerling_id"]
            isOneToOne: false
            referencedRelation: "leerlingen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leerling_leervoorkeuren_profiel_id_fkey"
            columns: ["profiel_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leerling_planningsrechten: {
        Row: {
          created_at: string
          id: string
          instructeur_id: string
          leerling_id: string
          updated_at: string
          vrijgegeven_at: string | null
          zelf_inplannen_limiet_is_handmatig: boolean
          zelf_inplannen_limiet_minuten_per_week: number | null
          zelf_inplannen_toegestaan: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          instructeur_id: string
          leerling_id: string
          updated_at?: string
          vrijgegeven_at?: string | null
          zelf_inplannen_limiet_is_handmatig?: boolean
          zelf_inplannen_limiet_minuten_per_week?: number | null
          zelf_inplannen_toegestaan?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          instructeur_id?: string
          leerling_id?: string
          updated_at?: string
          vrijgegeven_at?: string | null
          zelf_inplannen_limiet_is_handmatig?: boolean
          zelf_inplannen_limiet_minuten_per_week?: number | null
          zelf_inplannen_toegestaan?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "leerling_planningsrechten_instructeur_id_fkey"
            columns: ["instructeur_id"]
            isOneToOne: false
            referencedRelation: "instructeurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leerling_planningsrechten_leerling_id_fkey"
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
          les_id: string | null
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
          les_id?: string | null
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
          les_id?: string | null
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
          {
            foreignKeyName: "leerling_voortgang_beoordelingen_les_id_fkey"
            columns: ["les_id"]
            isOneToOne: false
            referencedRelation: "lessen"
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
          leerling_id: string
          les_id: string | null
          lesdatum: string
          samenvatting: string | null
          sterk_punt: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          focus_volgende_les?: string | null
          id?: string
          instructeur_id: string
          leerling_id: string
          les_id?: string | null
          lesdatum: string
          samenvatting?: string | null
          sterk_punt?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          focus_volgende_les?: string | null
          id?: string
          instructeur_id?: string
          leerling_id?: string
          les_id?: string | null
          lesdatum?: string
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
          {
            foreignKeyName: "leerling_voortgang_lesnotities_les_id_fkey"
            columns: ["les_id"]
            isOneToOne: false
            referencedRelation: "lessen"
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
          student_status: string
          student_status_reason: string | null
          student_status_updated_at: string
          voortgang_percentage: number
        }
        Insert: {
          created_at?: string
          favoriete_instructeurs?: string[] | null
          id?: string
          pakket_id?: string | null
          profile_id: string
          student_status?: string
          student_status_reason?: string | null
          student_status_updated_at?: string
          voortgang_percentage?: number
        }
        Update: {
          created_at?: string
          favoriete_instructeurs?: string[] | null
          id?: string
          pakket_id?: string | null
          profile_id?: string
          student_status?: string
          student_status_reason?: string | null
          student_status_updated_at?: string
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
      les_checkins: {
        Row: {
          arrival_mode: string | null
          confidence_level: number | null
          created_at: string
          id: string
          instructeur_id: string
          instructor_focus: string | null
          instructor_updated_at: string | null
          learner_updated_at: string | null
          leerling_id: string
          les_id: string
          support_request: string | null
          updated_at: string
        }
        Insert: {
          arrival_mode?: string | null
          confidence_level?: number | null
          created_at?: string
          id?: string
          instructeur_id: string
          instructor_focus?: string | null
          instructor_updated_at?: string | null
          learner_updated_at?: string | null
          leerling_id: string
          les_id: string
          support_request?: string | null
          updated_at?: string
        }
        Update: {
          arrival_mode?: string | null
          confidence_level?: number | null
          created_at?: string
          id?: string
          instructeur_id?: string
          instructor_focus?: string | null
          instructor_updated_at?: string | null
          learner_updated_at?: string | null
          leerling_id?: string
          les_id?: string
          support_request?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "les_checkins_instructeur_id_fkey"
            columns: ["instructeur_id"]
            isOneToOne: false
            referencedRelation: "instructeurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "les_checkins_leerling_id_fkey"
            columns: ["leerling_id"]
            isOneToOne: false
            referencedRelation: "leerlingen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "les_checkins_les_id_fkey"
            columns: ["les_id"]
            isOneToOne: true
            referencedRelation: "lessen"
            referencedColumns: ["id"]
          },
        ]
      }
      lesaanvragen: {
        Row: {
          aanvraag_type: string
          bericht: string | null
          created_at: string
          id: string
          instructeur_id: string
          leerling_id: string
          les_type: string | null
          pakket_id: string | null
          pakket_naam_snapshot: string | null
          status: Database["public"]["Enums"]["les_status"]
          tijdvak: string | null
          voorkeursdatum: string | null
        }
        Insert: {
          aanvraag_type?: string
          bericht?: string | null
          created_at?: string
          id?: string
          instructeur_id: string
          leerling_id: string
          les_type?: string | null
          pakket_id?: string | null
          pakket_naam_snapshot?: string | null
          status?: Database["public"]["Enums"]["les_status"]
          tijdvak?: string | null
          voorkeursdatum?: string | null
        }
        Update: {
          aanvraag_type?: string
          bericht?: string | null
          created_at?: string
          id?: string
          instructeur_id?: string
          leerling_id?: string
          les_type?: string | null
          pakket_id?: string | null
          pakket_naam_snapshot?: string | null
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
          {
            foreignKeyName: "lesaanvragen_pakket_id_fkey"
            columns: ["pakket_id"]
            isOneToOne: false
            referencedRelation: "pakketten"
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
          aanwezigheid_bevestigd_at: string | null
          aanwezigheid_status: Database["public"]["Enums"]["les_aanwezigheid_status"]
          afwezigheids_reden: string | null
          created_at: string
          duur_minuten: number
          herinnering_24h_verstuurd_at: string | null
          id: string
          instructeur_id: string | null
          leerling_id: string | null
          lesnotitie: string | null
          locatie_id: string | null
          notities: string | null
          pakket_id: string | null
          start_at: string | null
          status: Database["public"]["Enums"]["les_status"]
          titel: string
        }
        Insert: {
          aanwezigheid_bevestigd_at?: string | null
          aanwezigheid_status?: Database["public"]["Enums"]["les_aanwezigheid_status"]
          afwezigheids_reden?: string | null
          created_at?: string
          duur_minuten?: number
          herinnering_24h_verstuurd_at?: string | null
          id?: string
          instructeur_id?: string | null
          leerling_id?: string | null
          lesnotitie?: string | null
          locatie_id?: string | null
          notities?: string | null
          pakket_id?: string | null
          start_at?: string | null
          status?: Database["public"]["Enums"]["les_status"]
          titel: string
        }
        Update: {
          aanwezigheid_bevestigd_at?: string | null
          aanwezigheid_status?: Database["public"]["Enums"]["les_aanwezigheid_status"]
          afwezigheids_reden?: string | null
          created_at?: string
          duur_minuten?: number
          herinnering_24h_verstuurd_at?: string | null
          id?: string
          instructeur_id?: string | null
          leerling_id?: string | null
          lesnotitie?: string | null
          locatie_id?: string | null
          notities?: string | null
          pakket_id?: string | null
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
          {
            foreignKeyName: "lessen_pakket_id_fkey"
            columns: ["pakket_id"]
            isOneToOne: false
            referencedRelation: "pakketten"
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
          icon_key: string
          id: string
          instructeur_id: string | null
          labels: string[]
          les_type: string
          naam: string
          praktijk_examen_prijs: number | null
          prijs: number
          sort_order: number
          uitgelicht: boolean
          visual_theme: string
          zelf_inplannen_limiet_minuten_per_week: number | null
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
          icon_key?: string
          id?: string
          instructeur_id?: string | null
          labels?: string[]
          les_type?: string
          naam: string
          praktijk_examen_prijs?: number | null
          prijs?: number
          sort_order?: number
          uitgelicht?: boolean
          visual_theme?: string
          zelf_inplannen_limiet_minuten_per_week?: number | null
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
          icon_key?: string
          id?: string
          instructeur_id?: string | null
          labels?: string[]
          les_type?: string
          naam?: string
          praktijk_examen_prijs?: number | null
          prijs?: number
          sort_order?: number
          uitgelicht?: boolean
          visual_theme?: string
          zelf_inplannen_limiet_minuten_per_week?: number | null
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
        Args: never
        Returns: {
          instructeur_email: string
          instructeur_naam: string
          instructeur_profiel_id: string
          leerling_email: string
          leerling_naam: string
          leerling_profiel_id: string
          les_datum: string
          les_tijd: string
          les_titel: string
          lesson_id: string
          locatie: string
          start_at: string
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
