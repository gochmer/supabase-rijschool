alter table public.lesaanvragen
  add column if not exists aanvraag_type text not null default 'algemeen';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'lesaanvragen_aanvraag_type_check'
      and conrelid = 'public.lesaanvragen'::regclass
  ) then
    alter table public.lesaanvragen
      add constraint lesaanvragen_aanvraag_type_check
      check (aanvraag_type in ('algemeen', 'pakket', 'proefles'));
  end if;
end
$$;

create index if not exists lesaanvragen_aanvraag_type_idx
  on public.lesaanvragen (aanvraag_type);
