create table if not exists public.beschikbaarheid_weekroosters (
  id uuid primary key default gen_random_uuid(),
  instructeur_id uuid not null references public.instructeurs(id) on delete cascade,
  weekdag smallint not null check (weekdag between 1 and 7),
  start_tijd time not null,
  eind_tijd time not null,
  pauze_start_tijd time,
  pauze_eind_tijd time,
  beschikbaar boolean not null default true,
  actief boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint beschikbaarheid_weekroosters_pauze_pair_check check (
    (pauze_start_tijd is null and pauze_eind_tijd is null)
    or (pauze_start_tijd is not null and pauze_eind_tijd is not null)
  )
);

create index if not exists beschikbaarheid_weekroosters_instructeur_weekdag_idx
on public.beschikbaarheid_weekroosters (instructeur_id, weekdag);

alter table public.beschikbaarheid_weekroosters enable row level security;

drop trigger if exists set_beschikbaarheid_weekroosters_updated_at
on public.beschikbaarheid_weekroosters;
create trigger set_beschikbaarheid_weekroosters_updated_at
before update on public.beschikbaarheid_weekroosters
for each row execute procedure public.set_updated_at();

drop policy if exists "Eigen beschikbaarheid weekroosters lezen" on public.beschikbaarheid_weekroosters;
create policy "Eigen beschikbaarheid weekroosters lezen"
on public.beschikbaarheid_weekroosters
for select
to authenticated
using (
  exists (
    select 1
    from public.instructeurs i
    where i.id = beschikbaarheid_weekroosters.instructeur_id
      and i.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.rol = 'admin'
  )
);

drop policy if exists "Leerling met planningstoegang weekroosters lezen" on public.beschikbaarheid_weekroosters;
create policy "Leerling met planningstoegang weekroosters lezen"
on public.beschikbaarheid_weekroosters
for select
to authenticated
using (
  actief = true
  and beschikbaar = true
  and exists (
    select 1
    from public.leerlingen l
    join public.leerling_planningsrechten pr
      on pr.leerling_id = l.id
     and pr.instructeur_id = beschikbaarheid_weekroosters.instructeur_id
     and pr.zelf_inplannen_toegestaan = true
    where l.profile_id = (select auth.uid())
  )
);

drop policy if exists "Eigen beschikbaarheid weekroosters invoegen" on public.beschikbaarheid_weekroosters;
create policy "Eigen beschikbaarheid weekroosters invoegen"
on public.beschikbaarheid_weekroosters
for insert
to authenticated
with check (
  exists (
    select 1
    from public.instructeurs i
    where i.id = beschikbaarheid_weekroosters.instructeur_id
      and i.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.rol = 'admin'
  )
);

drop policy if exists "Eigen beschikbaarheid weekroosters bijwerken" on public.beschikbaarheid_weekroosters;
create policy "Eigen beschikbaarheid weekroosters bijwerken"
on public.beschikbaarheid_weekroosters
for update
to authenticated
using (
  exists (
    select 1
    from public.instructeurs i
    where i.id = beschikbaarheid_weekroosters.instructeur_id
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
    where i.id = beschikbaarheid_weekroosters.instructeur_id
      and i.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.rol = 'admin'
  )
);

drop policy if exists "Eigen beschikbaarheid weekroosters verwijderen" on public.beschikbaarheid_weekroosters;
create policy "Eigen beschikbaarheid weekroosters verwijderen"
on public.beschikbaarheid_weekroosters
for delete
to authenticated
using (
  exists (
    select 1
    from public.instructeurs i
    where i.id = beschikbaarheid_weekroosters.instructeur_id
      and i.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.rol = 'admin'
  )
);
