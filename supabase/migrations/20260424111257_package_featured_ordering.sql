alter table public.pakketten
add column if not exists sort_order integer not null default 0;

alter table public.pakketten
add column if not exists uitgelicht boolean not null default false;

with ranked as (
  select
    id,
    row_number() over (
      partition by instructeur_id
      order by created_at asc, id asc
    ) as volgorde
  from public.pakketten
)
update public.pakketten as pakketten
set sort_order = ranked.volgorde
from ranked
where ranked.id = pakketten.id;

create index if not exists pakketten_scope_order_idx
on public.pakketten (instructeur_id, sort_order, created_at);

create unique index if not exists pakketten_scope_featured_idx
on public.pakketten ((coalesce(instructeur_id, '00000000-0000-0000-0000-000000000000'::uuid)))
where uitgelicht = true;
