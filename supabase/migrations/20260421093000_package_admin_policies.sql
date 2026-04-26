create policy "Admin kan pakketten lezen"
on public.pakketten
for select
using (
  true
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.rol = 'admin'
  )
);

create policy "Admin kan pakketten bijwerken"
on public.pakketten
for update
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.rol = 'admin'
  )
);
