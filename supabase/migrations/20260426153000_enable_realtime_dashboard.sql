-- Enable Supabase Realtime for dashboard-critical tables.
-- Safe to run more than once in environments where tables are already in the publication.

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'lesaanvragen') then
    begin
      alter publication supabase_realtime add table public.lesaanvragen;
    exception when duplicate_object then
      null;
    end;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'lessen') then
    begin
      alter publication supabase_realtime add table public.lessen;
    exception when duplicate_object then
      null;
    end;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'notificaties') then
    begin
      alter publication supabase_realtime add table public.notificaties;
    exception when duplicate_object then
      null;
    end;
  end if;
end $$;
