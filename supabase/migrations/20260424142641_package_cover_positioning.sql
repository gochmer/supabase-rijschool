alter table public.pakketten
add column if not exists cover_position text not null default 'center';
