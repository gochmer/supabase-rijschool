create table if not exists public.instructeur_leerling_koppelingen (
  id uuid primary key default gen_random_uuid(),
  instructeur_id uuid not null references public.instructeurs(id) on delete cascade,
  leerling_id uuid not null references public.leerlingen(id) on delete cascade,
  bron text not null default 'handmatig',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (instructeur_id, leerling_id)
);

create index if not exists instructeur_leerling_koppelingen_instructeur_idx
on public.instructeur_leerling_koppelingen (instructeur_id);

create index if not exists instructeur_leerling_koppelingen_leerling_idx
on public.instructeur_leerling_koppelingen (leerling_id);

alter table public.instructeur_leerling_koppelingen enable row level security;

drop policy if exists "Instructeur mag eigen leerlingkoppelingen beheren" on public.instructeur_leerling_koppelingen;
create policy "Instructeur mag eigen leerlingkoppelingen beheren"
on public.instructeur_leerling_koppelingen
for all
to authenticated
using (
  exists (
    select 1
    from public.instructeurs i
    where i.id = instructeur_leerling_koppelingen.instructeur_id
      and i.profile_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.instructeurs i
    where i.id = instructeur_leerling_koppelingen.instructeur_id
      and i.profile_id = (select auth.uid())
  )
);

drop policy if exists "Leerling mag eigen leerlingkoppelingen lezen" on public.instructeur_leerling_koppelingen;
create policy "Leerling mag eigen leerlingkoppelingen lezen"
on public.instructeur_leerling_koppelingen
for select
to authenticated
using (
  exists (
    select 1
    from public.leerlingen l
    where l.id = instructeur_leerling_koppelingen.leerling_id
      and l.profile_id = (select auth.uid())
  )
);

drop policy if exists "Admin kan alle leerlingkoppelingen beheren" on public.instructeur_leerling_koppelingen;
create policy "Admin kan alle leerlingkoppelingen beheren"
on public.instructeur_leerling_koppelingen
for all
to authenticated
using (private.is_current_user_admin())
with check (private.is_current_user_admin());

drop trigger if exists set_instructeur_leerling_koppelingen_updated_at
on public.instructeur_leerling_koppelingen;

create trigger set_instructeur_leerling_koppelingen_updated_at
before update on public.instructeur_leerling_koppelingen
for each row execute function public.set_updated_at();

create or replace function private.can_current_instructor_access_learner(
  target_leerling_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.instructeurs i
    where i.profile_id = auth.uid()
      and (
        exists (
          select 1
          from public.instructeur_leerling_koppelingen koppeling
          where koppeling.instructeur_id = i.id
            and koppeling.leerling_id = target_leerling_id
        )
        or exists (
          select 1
          from public.lessen les
          where les.instructeur_id = i.id
            and les.leerling_id = target_leerling_id
        )
        or exists (
          select 1
          from public.lesaanvragen aanvraag
          where aanvraag.instructeur_id = i.id
            and aanvraag.leerling_id = target_leerling_id
        )
      )
  );
$$;

create or replace function private.can_current_learner_access_instructor(
  target_instructeur_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.leerlingen l
    where l.profile_id = auth.uid()
      and (
        exists (
          select 1
          from public.instructeur_leerling_koppelingen koppeling
          where koppeling.leerling_id = l.id
            and koppeling.instructeur_id = target_instructeur_id
        )
        or exists (
          select 1
          from public.lessen les
          where les.leerling_id = l.id
            and les.instructeur_id = target_instructeur_id
        )
        or exists (
          select 1
          from public.lesaanvragen aanvraag
          where aanvraag.leerling_id = l.id
            and aanvraag.instructeur_id = target_instructeur_id
        )
      )
  );
$$;

grant execute on function private.can_current_instructor_access_learner(uuid) to authenticated;
grant execute on function private.can_current_learner_access_instructor(uuid) to authenticated;
