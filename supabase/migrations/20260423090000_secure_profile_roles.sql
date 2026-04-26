create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;

create or replace function private.normalize_self_signup_role(requested_role text)
returns public.gebruikersrol
language sql
immutable
set search_path = ''
as $$
  select case
    when requested_role = 'instructeur' then 'instructeur'::public.gebruikersrol
    else 'leerling'::public.gebruikersrol
  end
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    volledige_naam,
    email,
    telefoon,
    rol
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'volledige_naam', ''),
    new.email,
    new.raw_user_meta_data ->> 'telefoon',
    private.normalize_self_signup_role(new.raw_user_meta_data ->> 'rol')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create or replace function private.handle_profile_role_records()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.rol = 'leerling' then
    insert into public.leerlingen (profile_id)
    values (new.id)
    on conflict (profile_id) do nothing;
  end if;

  if new.rol = 'instructeur' then
    insert into public.instructeurs (
      profile_id,
      slug,
      bio,
      werkgebied,
      profiel_status
    )
    values (
      new.id,
      concat('instructeur-', left(new.id::text, 8)),
      '',
      '{}',
      'in_beoordeling'
    )
    on conflict (profile_id) do nothing;
  end if;

  return new;
end;
$$;

create or replace function private.prevent_unauthorized_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_role public.gebruikersrol;
begin
  if new.rol is not distinct from old.rol then
    return new;
  end if;

  if auth.uid() is null then
    return new;
  end if;

  select p.rol
  into actor_role
  from public.profiles p
  where p.id = auth.uid();

  if actor_role is distinct from 'admin'::public.gebruikersrol then
    raise exception 'Alleen admins mogen profielrollen wijzigen.';
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

drop trigger if exists on_profile_created_role_records on public.profiles;
drop trigger if exists on_profile_role_records on public.profiles;
create trigger on_profile_role_records
after insert or update of rol on public.profiles
for each row execute function private.handle_profile_role_records();

drop trigger if exists prevent_unauthorized_profile_role_change on public.profiles;
create trigger prevent_unauthorized_profile_role_change
before update on public.profiles
for each row execute function private.prevent_unauthorized_profile_role_change();

drop policy if exists "Profiel eigenaar kan eigen profiel bijwerken" on public.profiles;
create policy "Profiel eigenaar kan eigen profiel bijwerken"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Admin kan alle profielen bijwerken"
on public.profiles
for update
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.rol = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.rol = 'admin'
  )
);

update auth.users
set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) - 'rol'
where coalesce(raw_user_meta_data, '{}'::jsonb) ? 'rol';

drop function if exists public.handle_new_user();
drop function if exists public.handle_profile_role_records();
