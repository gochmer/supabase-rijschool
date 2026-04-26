alter table public.pakketten
add column if not exists cover_focus_x double precision,
add column if not exists cover_focus_y double precision;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'pakketten_cover_focus_bounds_check'
  ) then
    alter table public.pakketten
    add constraint pakketten_cover_focus_bounds_check check (
      (cover_focus_x is null or (cover_focus_x >= 0 and cover_focus_x <= 100))
      and (cover_focus_y is null or (cover_focus_y >= 0 and cover_focus_y <= 100))
    );
  end if;
end
$$;
