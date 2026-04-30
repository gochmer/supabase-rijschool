alter table public.instructeurs
  add column if not exists standaard_rijles_duur_minuten integer,
  add column if not exists standaard_proefles_duur_minuten integer,
  add column if not exists standaard_pakketles_duur_minuten integer,
  add column if not exists standaard_examenrit_duur_minuten integer;

update public.instructeurs
set
  standaard_rijles_duur_minuten = coalesce(standaard_rijles_duur_minuten, 60),
  standaard_proefles_duur_minuten = coalesce(standaard_proefles_duur_minuten, 50),
  standaard_pakketles_duur_minuten = coalesce(standaard_pakketles_duur_minuten, 90),
  standaard_examenrit_duur_minuten = coalesce(standaard_examenrit_duur_minuten, 75);

alter table public.instructeurs
  alter column standaard_rijles_duur_minuten set default 60,
  alter column standaard_rijles_duur_minuten set not null,
  alter column standaard_proefles_duur_minuten set default 50,
  alter column standaard_proefles_duur_minuten set not null,
  alter column standaard_pakketles_duur_minuten set default 90,
  alter column standaard_pakketles_duur_minuten set not null,
  alter column standaard_examenrit_duur_minuten set default 75,
  alter column standaard_examenrit_duur_minuten set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'instructeurs_standaard_rijles_duur_minuten_check'
  ) then
    alter table public.instructeurs
      add constraint instructeurs_standaard_rijles_duur_minuten_check
      check (standaard_rijles_duur_minuten between 30 and 240);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'instructeurs_standaard_proefles_duur_minuten_check'
  ) then
    alter table public.instructeurs
      add constraint instructeurs_standaard_proefles_duur_minuten_check
      check (standaard_proefles_duur_minuten between 30 and 240);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'instructeurs_standaard_pakketles_duur_minuten_check'
  ) then
    alter table public.instructeurs
      add constraint instructeurs_standaard_pakketles_duur_minuten_check
      check (standaard_pakketles_duur_minuten between 30 and 240);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'instructeurs_standaard_examenrit_duur_minuten_check'
  ) then
    alter table public.instructeurs
      add constraint instructeurs_standaard_examenrit_duur_minuten_check
      check (standaard_examenrit_duur_minuten between 30 and 240);
  end if;
end $$;
