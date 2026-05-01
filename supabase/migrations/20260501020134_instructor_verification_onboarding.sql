-- Instructor verification onboarding: private WRM upload storage plus a structured review row.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'instructor-verifications',
  'instructor-verifications',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.instructeur_verificatie_aanvragen (
  id uuid primary key default gen_random_uuid(),
  instructeur_id uuid not null references public.instructeurs(id) on delete cascade,
  wrm_pasnummer text not null,
  wrm_categorie text not null,
  wrm_geldig_tot date not null,
  rijschool_organisatie text,
  functie_rol text,
  specialisaties text[] not null default '{}',
  status text not null default 'ingediend',
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint instructeur_verificatie_aanvragen_instructeur_unique unique (instructeur_id),
  constraint instructeur_verificatie_aanvragen_status_check
    check (status in ('concept', 'ingediend', 'in_beoordeling', 'goedgekeurd', 'afgewezen'))
);

alter table public.instructeur_verificatie_aanvragen enable row level security;

drop policy if exists "Eigen verificatie lezen" on public.instructeur_verificatie_aanvragen;
create policy "Eigen verificatie lezen"
on public.instructeur_verificatie_aanvragen
for select
to authenticated
using (
  exists (
    select 1 from public.instructeurs i
    where i.id = instructeur_verificatie_aanvragen.instructeur_id
      and i.profile_id = (select auth.uid())
  )
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.rol = 'admin'
  )
);

drop policy if exists "Eigen verificatie indienen" on public.instructeur_verificatie_aanvragen;
create policy "Eigen verificatie indienen"
on public.instructeur_verificatie_aanvragen
for insert
to authenticated
with check (
  exists (
    select 1 from public.instructeurs i
    where i.id = instructeur_verificatie_aanvragen.instructeur_id
      and i.profile_id = (select auth.uid())
  )
);

drop policy if exists "Eigen verificatie bijwerken" on public.instructeur_verificatie_aanvragen;
create policy "Eigen verificatie bijwerken"
on public.instructeur_verificatie_aanvragen
for update
to authenticated
using (
  exists (
    select 1 from public.instructeurs i
    where i.id = instructeur_verificatie_aanvragen.instructeur_id
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
    where i.id = instructeur_verificatie_aanvragen.instructeur_id
      and i.profile_id = (select auth.uid())
  )
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.rol = 'admin'
  )
);

drop policy if exists "Eigen documenten indienen" on public.instructeur_documenten;
create policy "Eigen documenten indienen"
on public.instructeur_documenten
for insert
to authenticated
with check (
  exists (
    select 1 from public.instructeurs i
    where i.id = instructeur_documenten.instructeur_id
      and i.profile_id = (select auth.uid())
  )
);

drop policy if exists "Eigen documenten bijwerken" on public.instructeur_documenten;
create policy "Eigen documenten bijwerken"
on public.instructeur_documenten
for update
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
)
with check (
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

drop policy if exists "Eigen verificatiebestanden uploaden" on storage.objects;
create policy "Eigen verificatiebestanden uploaden"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'instructor-verifications'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Eigen verificatiebestanden lezen" on storage.objects;
create policy "Eigen verificatiebestanden lezen"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'instructor-verifications'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.rol = 'admin'
    )
  )
);

drop policy if exists "Eigen verificatiebestanden vervangen" on storage.objects;
create policy "Eigen verificatiebestanden vervangen"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'instructor-verifications'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'instructor-verifications'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
