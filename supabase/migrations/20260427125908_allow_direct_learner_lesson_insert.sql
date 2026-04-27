drop policy if exists "Leerling met planningsrecht mag directe lessen invoegen" on public.lessen;

create policy "Leerling met planningsrecht mag directe lessen invoegen"
on public.lessen
for insert
to authenticated
with check (
  status = 'ingepland'
  and locatie_id is null
  and start_at is not null
  and duur_minuten >= 30
  and notities like 'request-ref:%'
  and exists (
    select 1
    from public.leerlingen l
    join public.leerling_planningsrechten pr
      on pr.leerling_id = l.id
     and pr.instructeur_id = lessen.instructeur_id
     and pr.zelf_inplannen_toegestaan = true
    where l.id = lessen.leerling_id
      and l.profile_id = (select auth.uid())
  )
  and exists (
    select 1
    from public.lesaanvragen aanvraag
    where aanvraag.id::text = substring(lessen.notities from 'request-ref:([a-f0-9-]+)')
      and aanvraag.leerling_id = lessen.leerling_id
      and aanvraag.instructeur_id = lessen.instructeur_id
      and aanvraag.status = 'ingepland'
  )
);
