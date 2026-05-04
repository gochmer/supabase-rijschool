create table if not exists public.leerling_leervoorkeuren (
  profiel_id uuid primary key references public.profiles(id) on delete cascade,
  leerling_id uuid references public.leerlingen(id) on delete set null,
  leerstijl text not null default 'praktisch',
  begeleiding text not null default 'rustig',
  oefenritme text not null default 'kort_en_vaker',
  spanningsniveau text not null default 'normaal',
  scenario_focus text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.leerling_leervoorkeuren enable row level security;

create index if not exists leerling_leervoorkeuren_leerling_idx
on public.leerling_leervoorkeuren (leerling_id);

drop policy if exists "Leerling leest eigen leervoorkeuren" on public.leerling_leervoorkeuren;
create policy "Leerling leest eigen leervoorkeuren"
on public.leerling_leervoorkeuren
for select
using (
  profiel_id = (select auth.uid())
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.rol = 'admin'
  )
);

drop policy if exists "Leerling maakt eigen leervoorkeuren" on public.leerling_leervoorkeuren;
create policy "Leerling maakt eigen leervoorkeuren"
on public.leerling_leervoorkeuren
for insert
with check (profiel_id = (select auth.uid()));

drop policy if exists "Leerling wijzigt eigen leervoorkeuren" on public.leerling_leervoorkeuren;
create policy "Leerling wijzigt eigen leervoorkeuren"
on public.leerling_leervoorkeuren
for update
using (profiel_id = (select auth.uid()))
with check (profiel_id = (select auth.uid()));
