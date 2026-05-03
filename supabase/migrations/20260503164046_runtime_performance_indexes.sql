-- Read-path indexes for dashboard pages, public catalog pages and RLS lookups.

create index if not exists leerlingen_profile_id_idx
  on public.leerlingen (profile_id);

create index if not exists leerlingen_pakket_id_idx
  on public.leerlingen (pakket_id)
  where pakket_id is not null;

create index if not exists instructeurs_created_at_idx
  on public.instructeurs (created_at desc);

create index if not exists notificaties_profiel_created_at_idx
  on public.notificaties (profiel_id, created_at desc);

create index if not exists berichten_ontvanger_created_at_idx
  on public.berichten (ontvanger_profiel_id, created_at desc);

create index if not exists berichten_afzender_created_at_idx
  on public.berichten (afzender_profiel_id, created_at desc);

create index if not exists lessen_instructeur_start_at_idx
  on public.lessen (instructeur_id, start_at desc);

create index if not exists lessen_leerling_start_at_idx
  on public.lessen (leerling_id, start_at);

create index if not exists lessen_instructeur_status_start_at_idx
  on public.lessen (instructeur_id, status, start_at);

create index if not exists lessen_leerling_status_start_at_idx
  on public.lessen (leerling_id, status, start_at);

create index if not exists lesaanvragen_instructeur_created_at_idx
  on public.lesaanvragen (instructeur_id, created_at desc);

create index if not exists lesaanvragen_instructeur_status_voorkeursdatum_idx
  on public.lesaanvragen (instructeur_id, status, voorkeursdatum);

create index if not exists lesaanvragen_leerling_status_voorkeursdatum_idx
  on public.lesaanvragen (leerling_id, status, voorkeursdatum);

create index if not exists beschikbaarheid_instructeur_eind_start_idx
  on public.beschikbaarheid (instructeur_id, eind_at, start_at);

create index if not exists beschikbaarheid_weekroosters_instructeur_actief_idx
  on public.beschikbaarheid_weekroosters (instructeur_id, actief);

create index if not exists pakketten_catalog_active_order_idx
  on public.pakketten (les_type, actief, uitgelicht desc, sort_order, created_at)
  where instructeur_id is null;

create index if not exists pakketten_instructeur_active_order_idx
  on public.pakketten (
    instructeur_id,
    actief,
    les_type,
    uitgelicht desc,
    sort_order,
    created_at
  );

create index if not exists reviews_instructeur_visible_created_at_idx
  on public.reviews (instructeur_id, verborgen, created_at desc);

create index if not exists betalingen_profiel_created_at_idx
  on public.betalingen (profiel_id, created_at desc);

create index if not exists leerling_planningsrechten_leerling_instructeur_idx
  on public.leerling_planningsrechten (leerling_id, instructeur_id);

create index if not exists instructeur_leerling_koppelingen_leerling_instructeur_idx
  on public.instructeur_leerling_koppelingen (leerling_id, instructeur_id);

create index if not exists locaties_stad_naam_idx
  on public.locaties (stad, naam);
