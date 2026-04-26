alter table public.pakketten
add column if not exists icon_key text not null default 'sparkles';

alter table public.pakketten
add column if not exists visual_theme text not null default 'sky';
