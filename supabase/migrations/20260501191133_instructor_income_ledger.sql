create table if not exists public.instructeur_inkomsten_transacties (
  id uuid primary key default gen_random_uuid(),
  instructeur_id uuid not null references public.instructeurs(id) on delete cascade,
  leerling_id uuid references public.leerlingen(id) on delete set null,
  les_id uuid references public.lessen(id) on delete set null,
  pakket_id uuid references public.pakketten(id) on delete set null,
  betaling_id uuid references public.betalingen(id) on delete set null,
  type text not null default 'les',
  bedrag numeric(10,2) not null default 0,
  btw_bedrag numeric(10,2) not null default 0,
  platform_fee numeric(10,2) not null default 0,
  netto_bedrag numeric(10,2) generated always as (bedrag - platform_fee) stored,
  status text not null default 'open',
  factuurnummer text,
  vervaldatum date,
  betaald_at timestamptz,
  herinnering_verstuurd_at timestamptz,
  omschrijving text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint instructeur_inkomsten_transacties_type_check
    check (type in ('les', 'pakket', 'losse_betaling', 'correctie', 'refund')),
  constraint instructeur_inkomsten_transacties_status_check
    check (status in ('open', 'verstuurd', 'betaald', 'te_laat', 'terugbetaald', 'geannuleerd')),
  constraint instructeur_inkomsten_transacties_amounts_check
    check (bedrag >= 0 and btw_bedrag >= 0 and platform_fee >= 0)
);

create table if not exists public.instructeur_uitbetalingen (
  id uuid primary key default gen_random_uuid(),
  instructeur_id uuid not null references public.instructeurs(id) on delete cascade,
  periode_start date not null,
  periode_eind date not null,
  bruto_bedrag numeric(10,2) not null default 0,
  platform_fee numeric(10,2) not null default 0,
  netto_bedrag numeric(10,2) generated always as (bruto_bedrag - platform_fee) stored,
  status text not null default 'gepland',
  uitbetaald_at timestamptz,
  referentie text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint instructeur_uitbetalingen_status_check
    check (status in ('gepland', 'in_verwerking', 'uitbetaald', 'mislukt')),
  constraint instructeur_uitbetalingen_amounts_check
    check (bruto_bedrag >= 0 and platform_fee >= 0),
  constraint instructeur_uitbetalingen_period_check
    check (periode_eind >= periode_start)
);

create index if not exists instructeur_inkomsten_transacties_instructeur_status_idx
on public.instructeur_inkomsten_transacties (instructeur_id, status, vervaldatum);

create index if not exists instructeur_inkomsten_transacties_les_idx
on public.instructeur_inkomsten_transacties (les_id)
where les_id is not null;

create index if not exists instructeur_inkomsten_transacties_betaling_idx
on public.instructeur_inkomsten_transacties (betaling_id)
where betaling_id is not null;

create unique index if not exists instructeur_inkomsten_transacties_factuurnummer_key
on public.instructeur_inkomsten_transacties (factuurnummer)
where factuurnummer is not null;

create unique index if not exists instructeur_inkomsten_transacties_unique_les_key
on public.instructeur_inkomsten_transacties (instructeur_id, les_id)
where les_id is not null and type = 'les';

create unique index if not exists instructeur_inkomsten_transacties_unique_betaling_key
on public.instructeur_inkomsten_transacties (instructeur_id, betaling_id)
where betaling_id is not null;

create index if not exists instructeur_uitbetalingen_instructeur_period_idx
on public.instructeur_uitbetalingen (instructeur_id, periode_start desc, periode_eind desc);

alter table public.instructeur_inkomsten_transacties enable row level security;
alter table public.instructeur_uitbetalingen enable row level security;

drop trigger if exists set_instructeur_inkomsten_transacties_updated_at
on public.instructeur_inkomsten_transacties;
create trigger set_instructeur_inkomsten_transacties_updated_at
before update on public.instructeur_inkomsten_transacties
for each row execute function public.set_updated_at();

drop trigger if exists set_instructeur_uitbetalingen_updated_at
on public.instructeur_uitbetalingen;
create trigger set_instructeur_uitbetalingen_updated_at
before update on public.instructeur_uitbetalingen
for each row execute function public.set_updated_at();

drop policy if exists "Eigen omzetboek lezen" on public.instructeur_inkomsten_transacties;
create policy "Eigen omzetboek lezen"
on public.instructeur_inkomsten_transacties
for select
to authenticated
using (
  exists (
    select 1 from public.instructeurs i
    where i.id = instructeur_inkomsten_transacties.instructeur_id
      and i.profile_id = (select auth.uid())
  )
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.rol = 'admin'
  )
);

drop policy if exists "Eigen omzetboek invoegen" on public.instructeur_inkomsten_transacties;
create policy "Eigen omzetboek invoegen"
on public.instructeur_inkomsten_transacties
for insert
to authenticated
with check (
  exists (
    select 1 from public.instructeurs i
    where i.id = instructeur_inkomsten_transacties.instructeur_id
      and i.profile_id = (select auth.uid())
  )
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.rol = 'admin'
  )
);

drop policy if exists "Eigen omzetboek bijwerken" on public.instructeur_inkomsten_transacties;
create policy "Eigen omzetboek bijwerken"
on public.instructeur_inkomsten_transacties
for update
to authenticated
using (
  exists (
    select 1 from public.instructeurs i
    where i.id = instructeur_inkomsten_transacties.instructeur_id
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
    where i.id = instructeur_inkomsten_transacties.instructeur_id
      and i.profile_id = (select auth.uid())
  )
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.rol = 'admin'
  )
);

drop policy if exists "Eigen omzetboek verwijderen" on public.instructeur_inkomsten_transacties;
create policy "Eigen omzetboek verwijderen"
on public.instructeur_inkomsten_transacties
for delete
to authenticated
using (
  exists (
    select 1 from public.instructeurs i
    where i.id = instructeur_inkomsten_transacties.instructeur_id
      and i.profile_id = (select auth.uid())
  )
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.rol = 'admin'
  )
);

drop policy if exists "Eigen uitbetalingen lezen" on public.instructeur_uitbetalingen;
create policy "Eigen uitbetalingen lezen"
on public.instructeur_uitbetalingen
for select
to authenticated
using (
  exists (
    select 1 from public.instructeurs i
    where i.id = instructeur_uitbetalingen.instructeur_id
      and i.profile_id = (select auth.uid())
  )
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.rol = 'admin'
  )
);

drop policy if exists "Eigen uitbetalingen invoegen" on public.instructeur_uitbetalingen;
create policy "Eigen uitbetalingen invoegen"
on public.instructeur_uitbetalingen
for insert
to authenticated
with check (
  exists (
    select 1 from public.instructeurs i
    where i.id = instructeur_uitbetalingen.instructeur_id
      and i.profile_id = (select auth.uid())
  )
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.rol = 'admin'
  )
);

drop policy if exists "Eigen uitbetalingen bijwerken" on public.instructeur_uitbetalingen;
create policy "Eigen uitbetalingen bijwerken"
on public.instructeur_uitbetalingen
for update
to authenticated
using (
  exists (
    select 1 from public.instructeurs i
    where i.id = instructeur_uitbetalingen.instructeur_id
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
    where i.id = instructeur_uitbetalingen.instructeur_id
      and i.profile_id = (select auth.uid())
  )
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.rol = 'admin'
  )
);
