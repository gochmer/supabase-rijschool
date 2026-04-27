drop policy if exists "Eigen notificaties bijwerken" on public.notificaties;
create policy "Eigen notificaties bijwerken"
on public.notificaties
for update
to authenticated
using (
  profiel_id = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.rol = 'admin'
  )
)
with check (
  profiel_id = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.rol = 'admin'
  )
);
