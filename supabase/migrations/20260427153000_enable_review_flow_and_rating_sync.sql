grant select on table public.reviews to anon;
grant select, insert, update on table public.reviews to authenticated;

create unique index if not exists reviews_unique_lesson_review_idx
  on public.reviews (les_id)
  where les_id is not null;

create or replace function private.recalculate_instructor_review_score(target_instructeur_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if target_instructeur_id is null then
    return;
  end if;

  update public.instructeurs
  set beoordeling = coalesce((
    select round(avg(r.score)::numeric, 1)
    from public.reviews r
    where r.instructeur_id = target_instructeur_id
      and coalesce(r.verborgen, false) = false
  ), 0)
  where id = target_instructeur_id;
end;
$$;

create or replace function private.sync_instructor_review_score()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.recalculate_instructor_review_score(coalesce(new.instructeur_id, old.instructeur_id));

  if tg_op = 'UPDATE' and old.instructeur_id is distinct from new.instructeur_id then
    perform private.recalculate_instructor_review_score(old.instructeur_id);
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists sync_instructor_review_score on public.reviews;
create trigger sync_instructor_review_score
after insert or update or delete on public.reviews
for each row execute function private.sync_instructor_review_score();

do $$
declare
  instructor_row record;
begin
  for instructor_row in select id from public.instructeurs loop
    perform private.recalculate_instructor_review_score(instructor_row.id);
  end loop;
end;
$$;

drop policy if exists "Publieke reviews lezen" on public.reviews;
drop policy if exists "Publieke zichtbare reviews lezen" on public.reviews;
drop policy if exists "Betrokken gebruikers en admin mogen reviews lezen" on public.reviews;
drop policy if exists "Leerling mag review plaatsen na afgeronde les" on public.reviews;
drop policy if exists "Leerling mag eigen review aanpassen" on public.reviews;
drop policy if exists "Admin kan reviews modereren" on public.reviews;

create policy "Publieke zichtbare reviews lezen"
on public.reviews
for select
using (coalesce(verborgen, false) = false);

create policy "Betrokken gebruikers en admin mogen reviews lezen"
on public.reviews
for select
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
