create table if not exists public.instructeur_kostenbonnen (
  id uuid primary key default gen_random_uuid(),
  instructeur_id uuid not null references public.instructeurs(id) on delete cascade,
  categorie text not null default 'overig',
  omschrijving text not null default '',
  bedrag numeric(10,2) not null default 0,
  btw_bedrag numeric(10,2) not null default 0,
  uitgegeven_op date not null default current_date,
  leverancier text,
  bestand_pad text,
  bestand_naam text,
  bestand_type text,
  bestand_grootte integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint instructeur_kostenbonnen_categorie_check
    check (categorie in ('brandstof', 'onderhoud', 'verzekering', 'platformkosten', 'overig')),
  constraint instructeur_kostenbonnen_amounts_check
    check (bedrag >= 0 and btw_bedrag >= 0),
  constraint instructeur_kostenbonnen_file_size_check
    check (bestand_grootte is null or bestand_grootte >= 0)
);

create index if not exists instructeur_kostenbonnen_instructeur_date_idx
on public.instructeur_kostenbonnen (instructeur_id, uitgegeven_op desc, created_at desc);

alter table public.instructeur_kostenbonnen enable row level security;

drop trigger if exists set_instructeur_kostenbonnen_updated_at
on public.instructeur_kostenbonnen;
create trigger set_instructeur_kostenbonnen_updated_at
before update on public.instructeur_kostenbonnen
for each row execute function public.set_updated_at();

drop policy if exists "Eigen kostenbonnen lezen" on public.instructeur_kostenbonnen;
create policy "Eigen kostenbonnen lezen"
on public.instructeur_kostenbonnen
for select
to authenticated
using (
  exists (
    select 1 from public.instructeurs i
    where i.id = instructeur_kostenbonnen.instructeur_id
      and i.profile_id = (select auth.uid())
  )
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.rol = 'admin'
  )
);

drop policy if exists "Eigen kostenbonnen invoegen" on public.instructeur_kostenbonnen;
create policy "Eigen kostenbonnen invoegen"
on public.instructeur_kostenbonnen
for insert
to authenticated
with check (
  exists (
    select 1 from public.instructeurs i
    where i.id = instructeur_kostenbonnen.instructeur_id
      and i.profile_id = (select auth.uid())
  )
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.rol = 'admin'
  )
);

drop policy if exists "Eigen kostenbonnen bijwerken" on public.instructeur_kostenbonnen;
create policy "Eigen kostenbonnen bijwerken"
on public.instructeur_kostenbonnen
for update
to authenticated
using (
  exists (
    select 1 from public.instructeurs i
    where i.id = instructeur_kostenbonnen.instructeur_id
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
    where i.id = instructeur_kostenbonnen.instructeur_id
      and i.profile_id = (select auth.uid())
  )
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.rol = 'admin'
  )
);

drop policy if exists "Eigen kostenbonnen verwijderen" on public.instructeur_kostenbonnen;
create policy "Eigen kostenbonnen verwijderen"
on public.instructeur_kostenbonnen
for delete
to authenticated
using (
  exists (
    select 1 from public.instructeurs i
    where i.id = instructeur_kostenbonnen.instructeur_id
      and i.profile_id = (select auth.uid())
  )
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.rol = 'admin'
  )
);

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'instructor-expense-receipts',
  'instructor-expense-receipts',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Eigen kostenbonbestanden uploaden" on storage.objects;
create policy "Eigen kostenbonbestanden uploaden"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'instructor-expense-receipts'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Eigen kostenbonbestanden lezen" on storage.objects;
create policy "Eigen kostenbonbestanden lezen"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'instructor-expense-receipts'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.rol = 'admin'
    )
  )
);

drop policy if exists "Eigen kostenbonbestanden vervangen" on storage.objects;
create policy "Eigen kostenbonbestanden vervangen"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'instructor-expense-receipts'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'instructor-expense-receipts'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Eigen kostenbonbestanden verwijderen" on storage.objects;
create policy "Eigen kostenbonbestanden verwijderen"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'instructor-expense-receipts'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
