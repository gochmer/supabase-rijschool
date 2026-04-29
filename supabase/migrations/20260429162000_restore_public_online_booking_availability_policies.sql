drop policy if exists "Publieke online boeking beschikbaarheid lezen" on public.beschikbaarheid;
create policy "Publieke online boeking beschikbaarheid lezen"
on public.beschikbaarheid
for select
using (
  beschikbaar = true
  and exists (
    select 1
    from public.instructeurs i
    where i.id = beschikbaarheid.instructeur_id
      and i.online_boeken_actief = true
  )
);

drop policy if exists "Publieke online boeking weekroosters lezen" on public.beschikbaarheid_weekroosters;
create policy "Publieke online boeking weekroosters lezen"
on public.beschikbaarheid_weekroosters
for select
using (
  actief = true
  and beschikbaar = true
  and exists (
    select 1
    from public.instructeurs i
    where i.id = beschikbaarheid_weekroosters.instructeur_id
      and i.online_boeken_actief = true
  )
);
