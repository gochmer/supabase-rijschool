drop policy if exists "Eigen lessen invoegen" on public.lessen;
create policy "Eigen lessen invoegen"
on public.lessen
for insert
to authenticated
with check (
  exists (
    select 1
    from public.instructeurs i
    where i.id = lessen.instructeur_id
      and i.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid()) and p.rol = 'admin'
  )
);

drop policy if exists "Eigen lessen bijwerken" on public.lessen;
create policy "Eigen lessen bijwerken"
on public.lessen
for update
to authenticated
using (
  exists (
    select 1
    from public.instructeurs i
    where i.id = lessen.instructeur_id
      and i.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid()) and p.rol = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.instructeurs i
    where i.id = lessen.instructeur_id
      and i.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid()) and p.rol = 'admin'
  )
);

drop policy if exists "Eigen lessen verwijderen" on public.lessen;
create policy "Eigen lessen verwijderen"
on public.lessen
for delete
to authenticated
using (
  exists (
    select 1
    from public.instructeurs i
    where i.id = lessen.instructeur_id
      and i.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid()) and p.rol = 'admin'
  )
);
