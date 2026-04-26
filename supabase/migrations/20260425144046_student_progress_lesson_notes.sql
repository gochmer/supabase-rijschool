create table if not exists public.leerling_voortgang_lesnotities (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  leerling_id uuid not null references public.leerlingen(id) on delete cascade,
  instructeur_id uuid not null references public.instructeurs(id) on delete cascade,
  lesdatum date not null,
  samenvatting text,
  sterk_punt text,
  focus_volgende_les text,
  constraint leerling_voortgang_lesnotities_uniek unique (
    leerling_id,
    instructeur_id,
    lesdatum
  )
);

create index if not exists leerling_voortgang_lesnotities_leerling_idx
on public.leerling_voortgang_lesnotities (leerling_id);

create index if not exists leerling_voortgang_lesnotities_instructeur_idx
on public.leerling_voortgang_lesnotities (instructeur_id);

create index if not exists leerling_voortgang_lesnotities_lesdatum_idx
on public.leerling_voortgang_lesnotities (lesdatum desc);

drop trigger if exists set_leerling_voortgang_lesnotities_updated_at
on public.leerling_voortgang_lesnotities;

create trigger set_leerling_voortgang_lesnotities_updated_at
before update on public.leerling_voortgang_lesnotities
for each row execute procedure public.set_updated_at();

alter table public.leerling_voortgang_lesnotities enable row level security;

create policy "Lesnotities lezen door betrokken leerling instructeur of admin"
on public.leerling_voortgang_lesnotities
for select
to authenticated
using (
  exists (
    select 1 from public.leerlingen l
    where l.id = leerling_voortgang_lesnotities.leerling_id
      and l.profile_id = (select auth.uid())
  )
  or exists (
    select 1 from public.instructeurs i
    where i.id = leerling_voortgang_lesnotities.instructeur_id
      and i.profile_id = (select auth.uid())
  )
  or private.is_current_user_admin()
);

create policy "Lesnotities invoegen door eigen instructeur of admin"
on public.leerling_voortgang_lesnotities
for insert
to authenticated
with check (
  exists (
    select 1 from public.instructeurs i
    where i.id = leerling_voortgang_lesnotities.instructeur_id
      and i.profile_id = (select auth.uid())
  )
  or private.is_current_user_admin()
);

create policy "Lesnotities bijwerken door eigen instructeur of admin"
on public.leerling_voortgang_lesnotities
for update
to authenticated
using (
  exists (
    select 1 from public.instructeurs i
    where i.id = leerling_voortgang_lesnotities.instructeur_id
      and i.profile_id = (select auth.uid())
  )
  or private.is_current_user_admin()
)
with check (
  exists (
    select 1 from public.instructeurs i
    where i.id = leerling_voortgang_lesnotities.instructeur_id
      and i.profile_id = (select auth.uid())
  )
  or private.is_current_user_admin()
);

create policy "Lesnotities verwijderen door eigen instructeur of admin"
on public.leerling_voortgang_lesnotities
for delete
to authenticated
using (
  exists (
    select 1 from public.instructeurs i
    where i.id = leerling_voortgang_lesnotities.instructeur_id
      and i.profile_id = (select auth.uid())
  )
  or private.is_current_user_admin()
);
