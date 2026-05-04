create table if not exists public.leerling_documenten (
  id uuid primary key default gen_random_uuid(),
  profiel_id uuid not null references public.profiles(id) on delete cascade,
  leerling_id uuid references public.leerlingen(id) on delete set null,
  document_type text not null default 'overig',
  naam text not null,
  status text not null default 'ingediend',
  bestand_pad text not null,
  bestand_naam text,
  bestand_type text,
  bestand_grootte integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.leerling_documenten enable row level security;

create index if not exists leerling_documenten_profiel_created_idx
on public.leerling_documenten (profiel_id, created_at desc);

create index if not exists leerling_documenten_leerling_created_idx
on public.leerling_documenten (leerling_id, created_at desc);

drop policy if exists "Leerling leest eigen documenten" on public.leerling_documenten;
create policy "Leerling leest eigen documenten"
on public.leerling_documenten
for select
using (
  profiel_id = (select auth.uid())
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.rol = 'admin'
  )
);

drop policy if exists "Leerling uploadt eigen documenten" on public.leerling_documenten;
create policy "Leerling uploadt eigen documenten"
on public.leerling_documenten
for insert
with check (profiel_id = (select auth.uid()));

drop policy if exists "Leerling verwijdert eigen documenten" on public.leerling_documenten;
create policy "Leerling verwijdert eigen documenten"
on public.leerling_documenten
for delete
using (profiel_id = (select auth.uid()));

drop policy if exists "Admin werkt leerlingdocumenten bij" on public.leerling_documenten;
create policy "Admin werkt leerlingdocumenten bij"
on public.leerling_documenten
for update
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.rol = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.rol = 'admin'
  )
);

drop policy if exists "Eigen supporttickets lezen" on public.support_tickets;
create policy "Eigen supporttickets lezen"
on public.support_tickets
for select
using (profiel_id = (select auth.uid()));

drop policy if exists "Eigen supporttickets aanmaken" on public.support_tickets;
create policy "Eigen supporttickets aanmaken"
on public.support_tickets
for insert
with check (profiel_id = (select auth.uid()));

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'learner-documents',
  'learner-documents',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Eigen leerlingdocumenten uploaden" on storage.objects;
create policy "Eigen leerlingdocumenten uploaden"
on storage.objects
for insert
with check (
  bucket_id = 'learner-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Eigen leerlingdocumenten lezen" on storage.objects;
create policy "Eigen leerlingdocumenten lezen"
on storage.objects
for select
using (
  bucket_id = 'learner-documents'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.rol = 'admin'
    )
  )
);

drop policy if exists "Eigen leerlingdocumenten vervangen" on storage.objects;
create policy "Eigen leerlingdocumenten vervangen"
on storage.objects
for update
using (
  bucket_id = 'learner-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'learner-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Eigen leerlingdocumenten verwijderen" on storage.objects;
create policy "Eigen leerlingdocumenten verwijderen"
on storage.objects
for delete
using (
  bucket_id = 'learner-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
