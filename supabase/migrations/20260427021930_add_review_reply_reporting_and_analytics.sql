alter table public.reviews
  add column if not exists antwoord_tekst text,
  add column if not exists antwoord_datum timestamptz,
  add column if not exists answered_by uuid references public.profiles (id) on delete set null;

comment on column public.reviews.antwoord_tekst is
  'Publiek antwoord van de instructeur op een review.';

comment on column public.reviews.antwoord_datum is
  'Tijdstip waarop de instructeurreactie voor het laatst is opgeslagen.';

comment on column public.reviews.answered_by is
  'Profiel-id van de instructeur die het antwoord heeft geplaatst.';

create table if not exists public.review_reports (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  reporter_profile_id uuid not null references public.profiles (id) on delete cascade,
  reden text not null,
  status text not null default 'nieuw',
  created_at timestamptz not null default timezone('utc', now()),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id) on delete set null
);

comment on table public.review_reports is
  'Meldingen van gebruikers over reviews die extra moderatie of controle nodig hebben.';

create unique index if not exists review_reports_unique_reporter_idx
  on public.review_reports (review_id, reporter_profile_id);

create index if not exists review_reports_review_id_idx
  on public.review_reports (review_id);

alter table public.review_reports enable row level security;

grant select, update on table public.review_reports to authenticated;
grant insert on table public.review_reports to authenticated;

drop policy if exists "Reporter mag eigen reviewmelding inzien" on public.review_reports;
drop policy if exists "Gebruiker mag review rapporteren" on public.review_reports;
drop policy if exists "Admin kan reviewmeldingen inzien" on public.review_reports;
drop policy if exists "Admin kan reviewmeldingen bijwerken" on public.review_reports;
drop policy if exists "Instructeur mag antwoorden op eigen reviews" on public.reviews;

create policy "Reporter mag eigen reviewmelding inzien"
on public.review_reports
for select
to authenticated
using (
  reporter_profile_id = auth.uid()
);

create policy "Gebruiker mag review rapporteren"
on public.review_reports
for insert
to authenticated
with check (
  reporter_profile_id = auth.uid()
);

create policy "Admin kan reviewmeldingen inzien"
on public.review_reports
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.rol = 'admin'
  )
);

create policy "Admin kan reviewmeldingen bijwerken"
on public.review_reports
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.rol = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.rol = 'admin'
  )
);

create policy "Instructeur mag antwoorden op eigen reviews"
on public.reviews
for update
to authenticated
using (
  exists (
    select 1
    from public.instructeurs i
    where i.id = reviews.instructeur_id
      and i.profile_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.instructeurs i
    where i.id = reviews.instructeur_id
      and i.profile_id = auth.uid()
  )
);
