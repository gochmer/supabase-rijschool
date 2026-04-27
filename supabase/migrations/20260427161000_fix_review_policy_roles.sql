drop policy if exists "Betrokken gebruikers en admin mogen reviews lezen" on public.reviews;
drop policy if exists "Leerling mag review plaatsen na afgeronde les" on public.reviews;
drop policy if exists "Leerling mag eigen review aanpassen" on public.reviews;
drop policy if exists "Admin kan reviews modereren" on public.reviews;

create policy "Betrokken gebruikers en admin mogen reviews lezen"
on public.reviews
for select
to authenticated
using (
  exists (
    select 1
    from public.leerlingen l
    where l.id = reviews.leerling_id
      and l.profile_id = auth.uid()
  )
  or exists (
    select 1
    from public.instructeurs i
    where i.id = reviews.instructeur_id
      and i.profile_id = auth.uid()
  )
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.rol = 'admin'
  )
);

create policy "Leerling mag review plaatsen na afgeronde les"
on public.reviews
for insert
to authenticated
with check (
  exists (
    select 1
    from public.leerlingen l
    join public.lessen les on les.leerling_id = l.id
    where l.profile_id = auth.uid()
      and l.id = reviews.leerling_id
      and les.id = reviews.les_id
      and les.instructeur_id = reviews.instructeur_id
      and les.status = 'afgerond'
  )
);

create policy "Leerling mag eigen review aanpassen"
on public.reviews
for update
to authenticated
using (
  exists (
    select 1
    from public.leerlingen l
    where l.id = reviews.leerling_id
      and l.profile_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.leerlingen l
    join public.lessen les on les.leerling_id = l.id
    where l.profile_id = auth.uid()
      and l.id = reviews.leerling_id
      and les.id = reviews.les_id
      and les.instructeur_id = reviews.instructeur_id
      and les.status = 'afgerond'
  )
);

create policy "Admin kan reviews modereren"
on public.reviews
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.rol = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.rol = 'admin'
  )
);
