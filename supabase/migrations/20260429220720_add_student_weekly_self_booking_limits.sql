alter table public.leerling_planningsrechten
  add column if not exists zelf_inplannen_limiet_minuten_per_week integer;

comment on column public.leerling_planningsrechten.zelf_inplannen_limiet_minuten_per_week is
  'Persoonlijke weeklimiet in minuten voor zelfstandig lessen boeken door deze leerling. Null betekent onbeperkt.';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'leerling_planningsrechten_weeklimiet_minuten_check'
  ) then
    alter table public.leerling_planningsrechten
      add constraint leerling_planningsrechten_weeklimiet_minuten_check
      check (
        zelf_inplannen_limiet_minuten_per_week is null
        or zelf_inplannen_limiet_minuten_per_week between 30 and 1440
      );
  end if;
end $$;
