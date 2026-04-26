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

drop policy if exists "Eigen leerlingrecord lezen" on public.leerlingen;
drop policy if exists "Admin kan alle leerlingrecords lezen" on public.leerlingen;
drop policy if exists "Instructeur mag gekoppelde leerlingrecords lezen" on public.leerlingen;

create policy "Eigen leerlingrecord lezen"
on public.leerlingen
for select
using (profile_id = auth.uid());

create policy "Admin kan alle leerlingrecords lezen"
on public.leerlingen
for select
using (private.is_current_user_admin());

create policy "Instructeur mag gekoppelde leerlingrecords lezen"
on public.leerlingen
for select
using (private.can_current_instructor_access_learner(id));

drop policy if exists "Instructeur mag gekoppelde leerlingprofielen lezen" on public.profiles;
drop policy if exists "Leerling mag gekoppelde instructeurprofielen lezen" on public.profiles;

create policy "Instructeur mag gekoppelde leerlingprofielen lezen"
on public.profiles
for select
using (
  exists (
    select 1
    from public.leerlingen l
    where l.profile_id = profiles.id
      and private.can_current_instructor_access_learner(l.id)
  )
);

create policy "Leerling mag gekoppelde instructeurprofielen lezen"
on public.profiles
for select
using (
  exists (
    select 1
    from public.instructeurs i
    where i.profile_id = profiles.id
      and private.can_current_learner_access_instructor(i.id)
  )
);
