create or replace function private.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and rol = 'admin'
  )
$$;

grant usage on schema private to authenticated;
grant execute on function private.is_current_user_admin() to authenticated;

drop policy if exists "Profiles zichtbaar voor eigenaar of admin" on public.profiles;
drop policy if exists "Admin kan alle profielen lezen" on public.profiles;
drop policy if exists "Admin kan alle profielen bijwerken" on public.profiles;

create policy "Profiel eigenaar kan eigen profiel lezen"
on public.profiles
for select
using (auth.uid() = id);

create policy "Admin kan alle profielen lezen"
on public.profiles
for select
using (private.is_current_user_admin());

create policy "Admin kan alle profielen bijwerken"
on public.profiles
for update
using (private.is_current_user_admin())
with check (private.is_current_user_admin());
