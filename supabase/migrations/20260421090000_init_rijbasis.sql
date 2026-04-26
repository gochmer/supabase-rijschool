create extension if not exists "pgcrypto";

create type public.gebruikersrol as enum ('leerling', 'instructeur', 'admin');
create type public.les_status as enum (
  'aangevraagd',
  'geaccepteerd',
  'geweigerd',
  'ingepland',
  'afgerond',
  'geannuleerd'
);
create type public.betaal_status as enum ('open', 'in_afwachting', 'betaald', 'mislukt');
create type public.transmissie_type as enum ('handgeschakeld', 'automaat', 'beide');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  volledige_naam text not null default '',
  email text not null unique,
  telefoon text,
  avatar_url text,
  rol public.gebruikersrol not null default 'leerling',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leerlingen (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  voortgang_percentage integer not null default 0,
  pakket_id uuid,
  favoriete_instructeurs uuid[] default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.instructeurs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  slug text not null unique,
  bio text,
  ervaring_jaren integer not null default 0,
  werkgebied text[] not null default '{}',
  prijs_per_les numeric(10,2) not null default 0,
  transmissie public.transmissie_type not null default 'beide',
  beoordeling numeric(3,2) not null default 0,
  profiel_status text not null default 'concept',
  profiel_compleetheid integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lessen (
  id uuid primary key default gen_random_uuid(),
  leerling_id uuid references public.leerlingen(id) on delete set null,
  instructeur_id uuid references public.instructeurs(id) on delete set null,
  titel text not null,
  start_at timestamptz,
  duur_minuten integer not null default 60,
  status public.les_status not null default 'aangevraagd',
  locatie_id uuid,
  notities text,
  created_at timestamptz not null default now()
);

create table if not exists public.lesaanvragen (
  id uuid primary key default gen_random_uuid(),
  leerling_id uuid not null references public.leerlingen(id) on delete cascade,
  instructeur_id uuid not null references public.instructeurs(id) on delete cascade,
  voorkeursdatum date,
  tijdvak text,
  status public.les_status not null default 'aangevraagd',
  bericht text,
  created_at timestamptz not null default now()
);

create table if not exists public.beschikbaarheid (
  id uuid primary key default gen_random_uuid(),
  instructeur_id uuid not null references public.instructeurs(id) on delete cascade,
  start_at timestamptz not null,
  eind_at timestamptz not null,
  beschikbaar boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.boekingen (
  id uuid primary key default gen_random_uuid(),
  lesaanvraag_id uuid references public.lesaanvragen(id) on delete set null,
  les_id uuid references public.lessen(id) on delete set null,
  status public.les_status not null default 'ingepland',
  created_at timestamptz not null default now()
);

create table if not exists public.pakketten (
  id uuid primary key default gen_random_uuid(),
  naam text not null,
  beschrijving text,
  prijs numeric(10,2) not null default 0,
  aantal_lessen integer not null default 0,
  actief boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.betalingen (
  id uuid primary key default gen_random_uuid(),
  profiel_id uuid not null references public.profiles(id) on delete cascade,
  pakket_id uuid references public.pakketten(id) on delete set null,
  bedrag numeric(10,2) not null default 0,
  status public.betaal_status not null default 'open',
  provider text default 'mock',
  betaald_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  leerling_id uuid not null references public.leerlingen(id) on delete cascade,
  instructeur_id uuid not null references public.instructeurs(id) on delete cascade,
  les_id uuid references public.lessen(id) on delete set null,
  score integer not null check (score between 1 and 5),
  titel text,
  tekst text,
  created_at timestamptz not null default now()
);

create table if not exists public.berichten (
  id uuid primary key default gen_random_uuid(),
  afzender_profiel_id uuid not null references public.profiles(id) on delete cascade,
  ontvanger_profiel_id uuid not null references public.profiles(id) on delete cascade,
  onderwerp text not null,
  inhoud text not null,
  gelezen boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.notificaties (
  id uuid primary key default gen_random_uuid(),
  profiel_id uuid not null references public.profiles(id) on delete cascade,
  titel text not null,
  tekst text not null,
  type text not null default 'info',
  ongelezen boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.instructeur_documenten (
  id uuid primary key default gen_random_uuid(),
  instructeur_id uuid not null references public.instructeurs(id) on delete cascade,
  naam text not null,
  url text,
  status text not null default 'ingediend',
  created_at timestamptz not null default now()
);

create table if not exists public.voertuigen (
  id uuid primary key default gen_random_uuid(),
  instructeur_id uuid not null references public.instructeurs(id) on delete cascade,
  model text not null,
  kenteken text not null,
  transmissie public.transmissie_type not null,
  status text not null default 'actief',
  created_at timestamptz not null default now()
);

create table if not exists public.locaties (
  id uuid primary key default gen_random_uuid(),
  naam text not null,
  stad text not null,
  regio text,
  adres text,
  created_at timestamptz not null default now()
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  profiel_id uuid not null references public.profiles(id) on delete cascade,
  onderwerp text not null,
  omschrijving text not null,
  status text not null default 'open',
  prioriteit text not null default 'normaal',
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    volledige_naam,
    email,
    telefoon,
    rol
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'volledige_naam', ''),
    new.email,
    new.raw_user_meta_data ->> 'telefoon',
    coalesce((new.raw_user_meta_data ->> 'rol')::public.gebruikersrol, 'leerling')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.leerlingen enable row level security;
alter table public.instructeurs enable row level security;
alter table public.lessen enable row level security;
alter table public.lesaanvragen enable row level security;
alter table public.beschikbaarheid enable row level security;
alter table public.boekingen enable row level security;
alter table public.pakketten enable row level security;
alter table public.betalingen enable row level security;
alter table public.reviews enable row level security;
alter table public.berichten enable row level security;
alter table public.notificaties enable row level security;
alter table public.instructeur_documenten enable row level security;
alter table public.voertuigen enable row level security;
alter table public.locaties enable row level security;
alter table public.support_tickets enable row level security;

create policy "Profiles zichtbaar voor eigenaar of admin"
on public.profiles
for select
using (auth.uid() = id or exists (
  select 1 from public.profiles p where p.id = auth.uid() and p.rol = 'admin'
));

create policy "Profiel eigenaar kan eigen profiel bijwerken"
on public.profiles
for update
using (auth.uid() = id);

create policy "Publieke instructeurs zijn leesbaar"
on public.instructeurs
for select
using (true);

create policy "Pakketten zijn publiek leesbaar"
on public.pakketten
for select
using (true);

create policy "Locaties zijn publiek leesbaar"
on public.locaties
for select
using (true);
