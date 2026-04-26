alter table public.pakketten
add column if not exists les_type text not null default 'auto';

alter table public.pakketten
drop constraint if exists pakketten_les_type_check;

alter table public.pakketten
add constraint pakketten_les_type_check
check (les_type in ('auto', 'motor', 'vrachtwagen'));

create index if not exists pakketten_les_type_idx
on public.pakketten (les_type);

create index if not exists pakketten_instructeur_les_type_idx
on public.pakketten (instructeur_id, les_type);
