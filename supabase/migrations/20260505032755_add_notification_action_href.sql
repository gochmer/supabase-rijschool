alter table public.notificaties
add column if not exists action_href text;

comment on column public.notificaties.action_href is
  'Optionele interne route waar de notificatie direct naartoe leidt, bijvoorbeeld een feedbackflow of betaling.';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'notificaties_action_href_internal_path_check'
      and conrelid = 'public.notificaties'::regclass
  ) then
    alter table public.notificaties
    add constraint notificaties_action_href_internal_path_check
    check (
      action_href is null
      or (
        left(action_href, 1) = '/'
        and left(action_href, 2) <> '//'
      )
    );
  end if;
end
$$;
