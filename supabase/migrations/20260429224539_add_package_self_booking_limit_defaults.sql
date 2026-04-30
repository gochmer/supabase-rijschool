alter table public.pakketten
add column if not exists zelf_inplannen_limiet_minuten_per_week integer;

comment on column public.pakketten.zelf_inplannen_limiet_minuten_per_week is
  'Standaard aantal minuten per week dat een leerling met dit pakket zelf mag inplannen. Null betekent geen pakketlimiet.';

alter table public.pakketten
drop constraint if exists pakketten_zelf_inplannen_limiet_minuten_per_week_check;

alter table public.pakketten
add constraint pakketten_zelf_inplannen_limiet_minuten_per_week_check
check (
  zelf_inplannen_limiet_minuten_per_week is null
  or (
    zelf_inplannen_limiet_minuten_per_week >= 30
    and zelf_inplannen_limiet_minuten_per_week <= 1440
  )
);

alter table public.leerling_planningsrechten
add column if not exists zelf_inplannen_limiet_is_handmatig boolean not null default false;

comment on column public.leerling_planningsrechten.zelf_inplannen_limiet_is_handmatig is
  'Geeft aan of de per-leerling weeklimiet handmatig is overschreven. False betekent: volg pakketlimiet of onbeperkt.';

update public.leerling_planningsrechten
set zelf_inplannen_limiet_is_handmatig = true
where zelf_inplannen_limiet_is_handmatig is distinct from true;
