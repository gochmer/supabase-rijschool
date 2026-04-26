create or replace function private.is_current_user_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'rol', '') = 'admin'
$$;

grant usage on schema private to authenticated;
grant execute on function private.is_current_user_admin() to authenticated;

update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('rol', 'admin')
where id in (
  select p.id
  from public.profiles p
  where p.rol = 'admin'
);

drop policy if exists "Profiles zichtbaar voor eigenaar of admin" on public.profiles;
drop policy if exists "Admin kan alle profielen lezen" on public.profiles;
drop policy if exists "Admin kan alle profielen bijwerken" on public.profiles;
drop policy if exists "Profiel eigenaar kan eigen profiel lezen" on public.profiles;
drop policy if exists "Publieke instructeursprofielen lezen" on public.profiles;

create policy "Profiel eigenaar kan eigen profiel lezen"
on public.profiles
for select
using (auth.uid() = id);

create policy "Admin kan alle profielen lezen"
on public.profiles
for select
using (private.is_current_user_admin());

create policy "Publieke instructeursprofielen lezen"
on public.profiles
for select
using (
  exists (
    select 1 from public.instructeurs i
    where i.profile_id = profiles.id
  )
  or auth.uid() = id
  or private.is_current_user_admin()
);

create policy "Admin kan alle profielen bijwerken"
on public.profiles
for update
using (private.is_current_user_admin())
with check (private.is_current_user_admin());
