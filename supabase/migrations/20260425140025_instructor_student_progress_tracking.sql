create table if not exists public.leerling_voortgang_beoordelingen (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  leerling_id uuid not null references public.leerlingen(id) on delete cascade,
  instructeur_id uuid not null references public.instructeurs(id) on delete cascade,
  vaardigheid_key text not null,
  beoordelings_datum date not null,
  status text not null check (status in ('uitleg', 'begeleid', 'zelfstandig', 'herhaling')),
  notitie text,
  constraint leerling_voortgang_uniek_moment unique (
    leerling_id,
    instructeur_id,
    vaardigheid_key,
    beoordelings_datum
  )
);

create index if not exists leerling_voortgang_leerling_idx
on public.leerling_voortgang_beoordelingen (leerling_id);

create index if not exists leerling_voortgang_instructeur_idx
on public.leerling_voortgang_beoordelingen (instructeur_id);

create index if not exists leerling_voortgang_datum_idx
on public.leerling_voortgang_beoordelingen (beoordelings_datum desc);

alter table public.leerling_voortgang_beoordelingen enable row level security;

create policy "Voortgang lezen door betrokken leerling instructeur of admin"
on public.leerling_voortgang_beoordelingen
for select
to authenticated
using (
  exists (
    select 1 from public.leerlingen l
    where l.id = leerling_voortgang_beoordelingen.leerling_id
      and l.profile_id = (select auth.uid())
  )
  or exists (
    select 1 from public.instructeurs i
    where i.id = leerling_voortgang_beoordelingen.instructeur_id
      and i.profile_id = (select auth.uid())
  )
  or private.is_current_user_admin()
);

create policy "Voortgang invoegen door eigen instructeur of admin"
on public.leerling_voortgang_beoordelingen
for insert
to authenticated
with check (
  exists (
    select 1 from public.instructeurs i
    where i.id = leerling_voortgang_beoordelingen.instructeur_id
      and i.profile_id = (select auth.uid())
  )
  or private.is_current_user_admin()
);

create policy "Voortgang bijwerken door eigen instructeur of admin"
on public.leerling_voortgang_beoordelingen
for update
to authenticated
using (
  exists (
    select 1 from public.instructeurs i
    where i.id = leerling_voortgang_beoordelingen.instructeur_id
      and i.profile_id = (select auth.uid())
  )
  or private.is_current_user_admin()
)
with check (
  exists (
    select 1 from public.instructeurs i
    where i.id = leerling_voortgang_beoordelingen.instructeur_id
      and i.profile_id = (select auth.uid())
  )
  or private.is_current_user_admin()
);

create policy "Voortgang verwijderen door eigen instructeur of admin"
on public.leerling_voortgang_beoordelingen
for delete
to authenticated
using (
  exists (
    select 1 from public.instructeurs i
    where i.id = leerling_voortgang_beoordelingen.instructeur_id
      and i.profile_id = (select auth.uid())
  )
  or private.is_current_user_admin()
);
