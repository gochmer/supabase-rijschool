drop policy if exists "Systeem of eigenaar kan notificaties invoegen" on public.notificaties;

create policy "Gekoppelde gebruiker of eigenaar kan notificaties invoegen"
on public.notificaties
for insert
with check (
  profiel_id = auth.uid()
  or private.is_current_user_admin()
  or exists (
    select 1
    from public.instructeurs i
    where i.profile_id = notificaties.profiel_id
      and private.can_current_learner_access_instructor(i.id)
  )
  or exists (
    select 1
    from public.leerlingen l
    where l.profile_id = notificaties.profiel_id
      and private.can_current_instructor_access_learner(l.id)
  )
);
