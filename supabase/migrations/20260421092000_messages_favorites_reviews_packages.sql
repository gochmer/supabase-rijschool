alter table public.reviews
  add column if not exists moderatie_status text not null default 'zichtbaar';

alter table public.reviews
  add column if not exists verborgen boolean not null default false;

alter table public.reviews
  add column if not exists moderated_at timestamptz;

create policy "Eigen berichten lezen"
on public.berichten
for select
using (
  afzender_profiel_id = auth.uid()
  or ontvanger_profiel_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.rol = 'admin'
  )
);

create policy "Eigen berichten versturen"
on public.berichten
for insert
with check (afzender_profiel_id = auth.uid());

create policy "Eigen notificaties lezen"
on public.notificaties
for select
using (
  profiel_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.rol = 'admin'
  )
);

create policy "Systeem of eigenaar kan notificaties invoegen"
on public.notificaties
for insert
with check (
  profiel_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.rol = 'admin'
  )
);

create policy "Publieke zichtbare reviews lezen"
on public.reviews
for select
using (coalesce(verborgen, false) = false);
