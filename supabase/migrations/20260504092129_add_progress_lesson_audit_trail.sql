alter table public.leerling_voortgang_beoordelingen
add column if not exists les_id uuid references public.lessen(id) on delete set null;

alter table public.leerling_voortgang_lesnotities
add column if not exists les_id uuid references public.lessen(id) on delete set null;

drop index if exists public.leerling_voortgang_uniek_les_moment;
drop index if exists public.leerling_voortgang_uniek_dag_moment;
drop index if exists public.leerling_voortgang_lesnotities_uniek_les;
drop index if exists public.leerling_voortgang_lesnotities_uniek_dag;

alter table public.leerling_voortgang_beoordelingen
drop constraint if exists leerling_voortgang_uniek_moment;

alter table public.leerling_voortgang_lesnotities
drop constraint if exists leerling_voortgang_lesnotities_uniek;

create unique index if not exists leerling_voortgang_uniek_les_moment
on public.leerling_voortgang_beoordelingen (
  leerling_id,
  instructeur_id,
  vaardigheid_key,
  les_id
)
where les_id is not null;

create unique index if not exists leerling_voortgang_uniek_dag_moment
on public.leerling_voortgang_beoordelingen (
  leerling_id,
  instructeur_id,
  vaardigheid_key,
  beoordelings_datum
)
where les_id is null;

create index if not exists leerling_voortgang_les_idx
on public.leerling_voortgang_beoordelingen (les_id)
where les_id is not null;

create index if not exists leerling_voortgang_leerling_les_datum_idx
on public.leerling_voortgang_beoordelingen (
  leerling_id,
  instructeur_id,
  les_id,
  beoordelings_datum desc
);

create unique index if not exists leerling_voortgang_lesnotities_uniek_les
on public.leerling_voortgang_lesnotities (
  leerling_id,
  instructeur_id,
  les_id
)
where les_id is not null;

create unique index if not exists leerling_voortgang_lesnotities_uniek_dag
on public.leerling_voortgang_lesnotities (
  leerling_id,
  instructeur_id,
  lesdatum
)
where les_id is null;

create index if not exists leerling_voortgang_lesnotities_les_idx
on public.leerling_voortgang_lesnotities (les_id)
where les_id is not null;

create index if not exists leerling_voortgang_lesnotities_leerling_lesdatum_idx
on public.leerling_voortgang_lesnotities (
  leerling_id,
  instructeur_id,
  les_id,
  lesdatum desc
);
