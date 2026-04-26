alter table public.instructeurs
  add column if not exists volledige_naam text not null default '',
  add column if not exists avatar_url text,
  add column if not exists specialisaties text[] not null default '{}',
  add column if not exists profielfoto_kleur text not null default 'from-sky-300 via-cyan-400 to-blue-600';

alter table public.reviews
  add column if not exists leerling_naam_snapshot text;

create or replace function private.default_instructor_specialisaties(instructor_slug text)
returns text[]
language sql
immutable
set search_path = ''
as $$
  select case instructor_slug
    when 'sanne-van-dijk' then array['Faalangst', 'Spoedcursus', 'Examentraining']
    when 'mo-haddad' then array['Automaat', 'Opfrislessen', 'Beginners']
    when 'lisa-kramer' then array['Examentraining', 'Handgeschakeld', 'Stadsverkeer']
    else '{}'::text[]
  end
$$;

create or replace function private.default_instructor_color(instructor_slug text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case instructor_slug
    when 'sanne-van-dijk' then 'from-amber-300 via-orange-400 to-rose-500'
    when 'mo-haddad' then 'from-sky-300 via-cyan-400 to-blue-600'
    when 'lisa-kramer' then 'from-emerald-300 via-teal-400 to-cyan-600'
    else 'from-indigo-300 via-violet-400 to-purple-600'
  end
$$;

create or replace function private.hydrate_public_instructor_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_name text;
  profile_avatar text;
begin
  select p.volledige_naam, p.avatar_url
  into profile_name, profile_avatar
  from public.profiles p
  where p.id = new.profile_id;

  new.volledige_naam := coalesce(nullif(new.volledige_naam, ''), profile_name, '');
  new.avatar_url := coalesce(new.avatar_url, profile_avatar);

  if coalesce(array_length(new.specialisaties, 1), 0) = 0 then
    new.specialisaties := private.default_instructor_specialisaties(new.slug);
  end if;

  if coalesce(new.profielfoto_kleur, '') = '' then
    new.profielfoto_kleur := private.default_instructor_color(new.slug);
  end if;

  return new;
end;
$$;

create or replace function private.sync_public_instructor_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.instructeurs
  set
    volledige_naam = coalesce(new.volledige_naam, ''),
    avatar_url = new.avatar_url
  where profile_id = new.id;

  return new;
end;
$$;

create or replace function private.set_review_public_snapshot()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  leerling_naam text;
begin
  select p.volledige_naam
  into leerling_naam
  from public.leerlingen l
  join public.profiles p on p.id = l.profile_id
  where l.id = new.leerling_id;

  new.leerling_naam_snapshot := coalesce(nullif(leerling_naam, ''), 'Leerling');
  return new;
end;
$$;

drop trigger if exists hydrate_public_instructor_fields on public.instructeurs;
create trigger hydrate_public_instructor_fields
before insert or update of profile_id, slug, volledige_naam, avatar_url, specialisaties, profielfoto_kleur
on public.instructeurs
for each row execute function private.hydrate_public_instructor_fields();

drop trigger if exists sync_public_instructor_profile_fields on public.profiles;
create trigger sync_public_instructor_profile_fields
after insert or update of volledige_naam, avatar_url
on public.profiles
for each row execute function private.sync_public_instructor_profile_fields();

drop trigger if exists set_review_public_snapshot on public.reviews;
create trigger set_review_public_snapshot
before insert or update of leerling_id
on public.reviews
for each row execute function private.set_review_public_snapshot();

update public.instructeurs i
set
  volledige_naam = coalesce(p.volledige_naam, i.volledige_naam, ''),
  avatar_url = coalesce(p.avatar_url, i.avatar_url),
  specialisaties = case
    when coalesce(array_length(i.specialisaties, 1), 0) = 0
      then private.default_instructor_specialisaties(i.slug)
    else i.specialisaties
  end,
  profielfoto_kleur = case
    when coalesce(i.profielfoto_kleur, '') = ''
      then private.default_instructor_color(i.slug)
    else i.profielfoto_kleur
  end
from public.profiles p
where p.id = i.profile_id;

update public.reviews r
set leerling_naam_snapshot = coalesce(nullif(p.volledige_naam, ''), 'Leerling')
from public.leerlingen l
join public.profiles p on p.id = l.profile_id
where l.id = r.leerling_id;

create index if not exists reviews_leerling_naam_snapshot_idx
  on public.reviews (leerling_naam_snapshot);
