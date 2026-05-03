alter table public.lessen
  add column if not exists pakket_id uuid references public.pakketten(id) on delete set null;

create index if not exists lessen_pakket_id_idx
  on public.lessen (pakket_id);

update public.lessen as les
set pakket_id = leerling.pakket_id
from public.leerlingen as leerling
where les.leerling_id = leerling.id
  and les.pakket_id is null
  and leerling.pakket_id is not null;

drop policy if exists "Leerling mag directe lessen invoegen bij online boeking of planningsrecht" on public.lessen;

create policy "Leerling mag directe lessen invoegen bij online boeking of planningsrecht"
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
    join public.instructeurs i
      on i.id = lessen.instructeur_id
    where l.id = lessen.leerling_id
      and l.profile_id = (select auth.uid())
      and (
        i.online_boeken_actief = true
        or exists (
          select 1
          from public.leerling_planningsrechten pr
          where pr.leerling_id = l.id
            and pr.instructeur_id = lessen.instructeur_id
            and pr.zelf_inplannen_toegestaan = true
        )
      )
  )
  and exists (
    select 1
    from public.lesaanvragen aanvraag
    join public.leerlingen l
      on l.id = aanvraag.leerling_id
    where aanvraag.id::text = substring(lessen.notities from 'request-ref:([a-f0-9-]+)')
      and aanvraag.leerling_id = lessen.leerling_id
      and aanvraag.instructeur_id = lessen.instructeur_id
      and aanvraag.status = 'ingepland'
      and (
        aanvraag.aanvraag_type = 'proefles'
        or (
          lessen.pakket_id is not null
          and aanvraag.pakket_id = lessen.pakket_id
          and l.pakket_id = lessen.pakket_id
        )
      )
  )
);
