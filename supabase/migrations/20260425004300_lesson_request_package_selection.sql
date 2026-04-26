alter table public.lesaanvragen
  add column if not exists pakket_id uuid references public.pakketten(id) on delete set null,
  add column if not exists pakket_naam_snapshot text,
  add column if not exists les_type text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'lesaanvragen_les_type_check'
      and conrelid = 'public.lesaanvragen'::regclass
  ) then
    alter table public.lesaanvragen
      add constraint lesaanvragen_les_type_check
      check (les_type is null or les_type in ('auto', 'motor', 'vrachtwagen'));
  end if;
end
$$;

create index if not exists lesaanvragen_pakket_id_idx
  on public.lesaanvragen (pakket_id);

create index if not exists lesaanvragen_les_type_idx
  on public.lesaanvragen (les_type);
