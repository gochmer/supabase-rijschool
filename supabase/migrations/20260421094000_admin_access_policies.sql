create policy "Admin kan alle profielen lezen"
on public.profiles
for select
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.rol = 'admin'
  )
);

create policy "Admin kan alle leerlingrecords lezen"
on public.leerlingen
for select
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.rol = 'admin'
  )
);

create policy "Admin kan alle lessen lezen"
on public.lessen
for select
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.rol = 'admin'
  )
);

create policy "Admin kan alle betalingen lezen"
on public.betalingen
for select
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.rol = 'admin'
  )
);

create policy "Admin kan alle supporttickets lezen"
on public.support_tickets
for select
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.rol = 'admin'
  )
);

create policy "Admin kan supporttickets bijwerken"
on public.support_tickets
for update
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.rol = 'admin'
  )
);

create policy "Admin kan alle lesaanvragen lezen"
on public.lesaanvragen
for select
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.rol = 'admin'
  )
);
