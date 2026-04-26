create table if not exists public.leerling_planningsrechten (
  id uuid primary key default gen_random_uuid(),
  leerling_id uuid not null references public.leerlingen(id) on delete cascade,
  instructeur_id uuid not null references public.instructeurs(id) on delete cascade,
  zelf_inplannen_toegestaan boolean not null default false,
  vrijgegeven_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (leerling_id, instructeur_id)
);

create index if not exists leerling_planningsrechten_instructeur_leerling_idx
on public.leerling_planningsrechten (instructeur_id, leerling_id);

alter table public.leerling_planningsrechten enable row level security;

drop policy if exists "Leerling planningstoegang lezen" on public.leerling_planningsrechten;
create policy "Leerling planningstoegang lezen"
on public.leerling_planningsrechten
for select
to authenticated
using (
  exists (
    select 1
    from public.leerlingen l
    where l.id = leerling_planningsrechten.leerling_id
      and l.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.instructeurs i
    where i.id = leerling_planningsrechten.instructeur_id
      and i.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.rol = 'admin'
  )
);

drop policy if exists "Instructeur planningstoegang beheren" on public.leerling_planningsrechten;
create policy "Instructeur planningstoegang beheren"
on public.leerling_planningsrechten
for all
to authenticated
using (
  exists (
    select 1
    from public.instructeurs i
    where i.id = leerling_planningsrechten.instructeur_id
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
    where i.id = leerling_planningsrechten.instructeur_id
      and i.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.rol = 'admin'
  )
);

drop policy if exists "Publieke beschikbaarheid lezen" on public.beschikbaarheid;

drop policy if exists "Leerling met planningstoegang beschikbaarheid lezen" on public.beschikbaarheid;
create policy "Leerling met planningstoegang beschikbaarheid lezen"
on public.beschikbaarheid
for select
to authenticated
using (
  beschikbaar = true
  and exists (
    select 1
    from public.leerlingen l
    join public.leerling_planningsrechten pr
      on pr.leerling_id = l.id
     and pr.instructeur_id = beschikbaarheid.instructeur_id
     and pr.zelf_inplannen_toegestaan = true
    where l.profile_id = (select auth.uid())
  )
);
