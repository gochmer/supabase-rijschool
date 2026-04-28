do $$
begin
  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'les_aanwezigheid_status'
  ) then
    create type public.les_aanwezigheid_status as enum (
      'onbekend',
      'aanwezig',
      'afwezig'
    );
  end if;
end
$$;

alter table public.lessen
  add column if not exists aanwezigheid_status public.les_aanwezigheid_status default 'onbekend',
  add column if not exists aanwezigheid_bevestigd_at timestamptz,
  add column if not exists afwezigheids_reden text,
  add column if not exists lesnotitie text,
  add column if not exists herinnering_24h_verstuurd_at timestamptz;

update public.lessen
set aanwezigheid_status = 'onbekend'
where aanwezigheid_status is null;

alter table public.lessen
  alter column aanwezigheid_status set default 'onbekend',
  alter column aanwezigheid_status set not null;

comment on column public.lessen.aanwezigheid_status is
  'Bevestigt of een lesmoment uiteindelijk aanwezig of afwezig is afgesloten.';

comment on column public.lessen.aanwezigheid_bevestigd_at is
  'Tijdstip waarop aanwezigheid of afwezigheid is bevestigd.';

comment on column public.lessen.afwezigheids_reden is
  'Korte reden als een lesmoment als afwezig is afgesloten.';

comment on column public.lessen.lesnotitie is
  'Compacte lesnotitie per lesmoment, direct vast te leggen vanaf de lessenkaart.';

comment on column public.lessen.herinnering_24h_verstuurd_at is
  'Wordt gezet zodra de automatische 24-uurs herinnering is geclaimd en verzonden.';

create index if not exists lessen_reminder_window_idx
on public.lessen (start_at)
where status in ('geaccepteerd', 'ingepland')
  and herinnering_24h_verstuurd_at is null;

create or replace function public.claim_due_lesson_reminders()
returns table (
  lesson_id uuid,
  leerling_profiel_id uuid,
  instructeur_profiel_id uuid,
  leerling_email text,
  instructeur_email text,
  leerling_naam text,
  instructeur_naam text,
  les_titel text,
  les_datum text,
  les_tijd text,
  locatie text,
  start_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  with due as (
    select l.id
    from public.lessen l
    where l.status in ('geaccepteerd'::public.les_status, 'ingepland'::public.les_status)
      and l.start_at is not null
      and l.herinnering_24h_verstuurd_at is null
      and l.start_at >= now() + interval '23 hours'
      and l.start_at < now() + interval '25 hours'
    order by l.start_at asc
    for update skip locked
  ),
  marked as (
    update public.lessen l
    set herinnering_24h_verstuurd_at = now()
    from due d
    where l.id = d.id
    returning l.id, l.titel, l.start_at, l.leerling_id, l.instructeur_id, l.locatie_id
  ),
  payload as (
    select
      m.id as lesson_id,
      learner_profile.id as leerling_profiel_id,
      instructor_profile.id as instructeur_profiel_id,
      learner_profile.email as leerling_email,
      instructor_profile.email as instructeur_email,
      coalesce(learner_profile.volledige_naam, 'Leerling') as leerling_naam,
      coalesce(instructor_profile.volledige_naam, instructor.volledige_naam, 'Instructeur') as instructeur_naam,
      m.titel as les_titel,
      to_char(m.start_at at time zone 'Europe/Amsterdam', 'DD-MM-YYYY') as les_datum,
      to_char(m.start_at at time zone 'Europe/Amsterdam', 'HH24:MI') as les_tijd,
      case
        when location.id is null then 'Locatie volgt nog'
        else concat_ws(', ', nullif(location.naam, ''), location.stad)
      end as locatie,
      m.start_at
    from marked m
    left join public.leerlingen learner
      on learner.id = m.leerling_id
    left join public.profiles learner_profile
      on learner_profile.id = learner.profile_id
    left join public.instructeurs instructor
      on instructor.id = m.instructeur_id
    left join public.profiles instructor_profile
      on instructor_profile.id = instructor.profile_id
    left join public.locaties location
      on location.id = m.locatie_id
  ),
  learner_notifications as (
    insert into public.notificaties (
      profiel_id,
      titel,
      tekst,
      type,
      ongelezen
    )
    select
      p.leerling_profiel_id,
      'Lesherinnering voor morgen',
      format(
        '%s, je les met %s staat morgen om %s gepland.%s',
        p.leerling_naam,
        p.instructeur_naam,
        p.les_tijd,
        case
          when p.locatie <> 'Locatie volgt nog' then format(' Locatie: %s.', p.locatie)
          else ''
        end
      ),
      'info'::text,
      true
    from payload p
    where p.leerling_profiel_id is not null
  ),
  instructor_notifications as (
    insert into public.notificaties (
      profiel_id,
      titel,
      tekst,
      type,
      ongelezen
    )
    select
      p.instructeur_profiel_id,
      'Lesherinnering voor morgen',
      format(
        '%s staat morgen om %s voor %s ingepland.%s',
        p.leerling_naam,
        p.les_tijd,
        p.les_titel,
        case
          when p.locatie <> 'Locatie volgt nog' then format(' Startlocatie: %s.', p.locatie)
          else ''
        end
      ),
      'info'::text,
      true
    from payload p
    where p.instructeur_profiel_id is not null
  )
  select
    p.lesson_id,
    p.leerling_profiel_id,
    p.instructeur_profiel_id,
    p.leerling_email,
    p.instructeur_email,
    p.leerling_naam,
    p.instructeur_naam,
    p.les_titel,
    p.les_datum,
    p.les_tijd,
    p.locatie,
    p.start_at
  from payload p;
end;
$$;

revoke all on function public.claim_due_lesson_reminders() from public;
revoke all on function public.claim_due_lesson_reminders() from anon;
revoke all on function public.claim_due_lesson_reminders() from authenticated;
grant execute on function public.claim_due_lesson_reminders() to service_role;
