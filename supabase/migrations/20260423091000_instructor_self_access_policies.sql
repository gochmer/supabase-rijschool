create index if not exists lessen_leerling_id_idx
on public.lessen (leerling_id);

create index if not exists lessen_instructeur_id_idx
on public.lessen (instructeur_id);

create index if not exists betalingen_profiel_id_idx
on public.betalingen (profiel_id);

create index if not exists beschikbaarheid_instructeur_id_idx
on public.beschikbaarheid (instructeur_id);

create index if not exists voertuigen_instructeur_id_idx
on public.voertuigen (instructeur_id);

create index if not exists instructeur_documenten_instructeur_id_idx
on public.instructeur_documenten (instructeur_id);

drop policy if exists "Eigen lessen lezen" on public.lessen;
create policy "Eigen lessen lezen"
on public.lessen
for select
to authenticated
using (
  exists (
    select 1 from public.leerlingen l
    where l.id = lessen.leerling_id and l.profile_id = (select auth.uid())
  )
  or exists (
    select 1 from public.instructeurs i
    where i.id = lessen.instructeur_id and i.profile_id = (select auth.uid())
  )
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.rol = 'admin'
  )
);

drop policy if exists "Eigen betalingen lezen" on public.betalingen;
create policy "Eigen betalingen lezen"
on public.betalingen
for select
to authenticated
using (
  profiel_id = (select auth.uid())
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.rol = 'admin'
  )
);

drop policy if exists "Eigen beschikbaarheid lezen" on public.beschikbaarheid;
create policy "Eigen beschikbaarheid lezen"
on public.beschikbaarheid
for select
to authenticated
using (
  exists (
    select 1 from public.instructeurs i
    where i.id = beschikbaarheid.instructeur_id
      and i.profile_id = (select auth.uid())
  )
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.rol = 'admin'
  )
);

drop policy if exists "Eigen beschikbaarheid invoegen" on public.beschikbaarheid;
create policy "Eigen beschikbaarheid invoegen"
on public.beschikbaarheid
for insert
to authenticated
with check (
  exists (
    select 1 from public.instructeurs i
    where i.id = beschikbaarheid.instructeur_id
      and i.profile_id = (select auth.uid())
  )
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.rol = 'admin'
  )
);

drop policy if exists "Eigen beschikbaarheid bijwerken" on public.beschikbaarheid;
create policy "Eigen beschikbaarheid bijwerken"
on public.beschikbaarheid
for update
to authenticated
using (
  exists (
    select 1 from public.instructeurs i
    where i.id = beschikbaarheid.instructeur_id
      and i.profile_id = (select auth.uid())
  )
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.rol = 'admin'
  )
)
with check (
  exists (
    select 1 from public.instructeurs i
    where i.id = beschikbaarheid.instructeur_id
      and i.profile_id = (select auth.uid())
  )
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.rol = 'admin'
  )
);

drop policy if exists "Eigen beschikbaarheid verwijderen" on public.beschikbaarheid;
create policy "Eigen beschikbaarheid verwijderen"
on public.beschikbaarheid
for delete
to authenticated
using (
  exists (
    select 1 from public.instructeurs i
    where i.id = beschikbaarheid.instructeur_id
      and i.profile_id = (select auth.uid())
  )
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.rol = 'admin'
  )
);

drop policy if exists "Eigen voertuigen lezen" on public.voertuigen;
create policy "Eigen voertuigen lezen"
on public.voertuigen
for select
to authenticated
using (
  exists (
    select 1 from public.instructeurs i
    where i.id = voertuigen.instructeur_id
      and i.profile_id = (select auth.uid())
  )
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.rol = 'admin'
  )
);

drop policy if exists "Eigen documenten lezen" on public.instructeur_documenten;
create policy "Eigen documenten lezen"
on public.instructeur_documenten
for select
to authenticated
using (
  exists (
    select 1 from public.instructeurs i
    where i.id = instructeur_documenten.instructeur_id
      and i.profile_id = (select auth.uid())
  )
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.rol = 'admin'
  )
);
