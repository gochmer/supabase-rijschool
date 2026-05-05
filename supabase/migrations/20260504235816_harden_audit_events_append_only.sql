revoke update, delete on public.audit_events from authenticated;

drop policy if exists "Admin kan audit events beheren"
on public.audit_events;

drop policy if exists "Admin kan audit events invoegen"
on public.audit_events;
create policy "Admin kan audit events invoegen"
on public.audit_events
for insert
with check (private.is_current_user_admin());
