alter table public.instructeurs
add column if not exists leerling_annuleren_tot_uren_voor_les integer;

alter table public.instructeurs
drop constraint if exists instructeurs_leerling_annuleren_tot_uren_voor_les_check;

alter table public.instructeurs
add constraint instructeurs_leerling_annuleren_tot_uren_voor_les_check
check (
  leerling_annuleren_tot_uren_voor_les is null
  or leerling_annuleren_tot_uren_voor_les in (24, 48, 72)
);

comment on column public.instructeurs.leerling_annuleren_tot_uren_voor_les is
  'Aantal uren voor een les waarop een leerling nog zelf online mag annuleren. Null betekent dat zelf annuleren is uitgeschakeld.';
