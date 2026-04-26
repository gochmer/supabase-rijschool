alter table public.pakketten
add column if not exists instructeur_id uuid references public.instructeurs(id) on delete cascade;

alter table public.pakketten
add column if not exists badge text;

create index if not exists pakketten_instructeur_id_idx
on public.pakketten (instructeur_id);

drop policy if exists "Admin kan pakketten bijwerken" on public.pakketten;

create policy "Eigen of admin pakketten invoegen"
on public.pakketten
for insert
to authenticated
with check (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.rol = 'admin'
  )
  or exists (
    select 1 from public.instructeurs i
    where i.id = pakketten.instructeur_id
      and i.profile_id = (select auth.uid())
  )
);

create policy "Eigen of admin pakketten bijwerken"
on public.pakketten
for update
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.rol = 'admin'
  )
  or exists (
    select 1 from public.instructeurs i
    where i.id = pakketten.instructeur_id
      and i.profile_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.rol = 'admin'
  )
  or exists (
    select 1 from public.instructeurs i
    where i.id = pakketten.instructeur_id
      and i.profile_id = (select auth.uid())
  )
);

create policy "Eigen of admin pakketten verwijderen"
on public.pakketten
for delete
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.rol = 'admin'
  )
  or exists (
    select 1 from public.instructeurs i
    where i.id = pakketten.instructeur_id
      and i.profile_id = (select auth.uid())
  )
);
