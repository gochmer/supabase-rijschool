alter table public.pakketten
add column if not exists labels text[] not null default '{}'::text[];

update public.pakketten
set labels = '{}'::text[]
where labels is null;
