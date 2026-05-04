grant select, insert, update, delete on table public.voertuigen to authenticated;
grant select, insert, update, delete on table public.instructeur_documenten to authenticated;

drop policy if exists "Eigen voertuigen indienen" on public.voertuigen;
create policy "Eigen voertuigen indienen"
on public.voertuigen
for insert
to authenticated
with check (
  exists (
    select 1
    from public.instructeurs i
    where i.id = voertuigen.instructeur_id
      and i.profile_id = (select auth.uid())
  )
);

drop policy if exists "Eigen voertuigen bijwerken" on public.voertuigen;
create policy "Eigen voertuigen bijwerken"
on public.voertuigen
for update
to authenticated
using (
  exists (
    select 1
    from public.instructeurs i
    where i.id = voertuigen.instructeur_id
      and i.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.rol = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.instructeurs i
    where i.id = voertuigen.instructeur_id
      and i.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.rol = 'admin'
  )
);

drop policy if exists "Eigen voertuigen verwijderen" on public.voertuigen;
create policy "Eigen voertuigen verwijderen"
on public.voertuigen
for delete
to authenticated
using (
  exists (
    select 1
    from public.instructeurs i
    where i.id = voertuigen.instructeur_id
      and i.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.rol = 'admin'
  )
);

drop policy if exists "Eigen documenten verwijderen" on public.instructeur_documenten;
create policy "Eigen documenten verwijderen"
on public.instructeur_documenten
for delete
to authenticated
using (
  exists (
    select 1
    from public.instructeurs i
    where i.id = instructeur_documenten.instructeur_id
      and i.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.rol = 'admin'
  )
);
