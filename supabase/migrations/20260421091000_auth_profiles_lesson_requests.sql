alter table public.leerlingen
  add constraint leerlingen_profile_id_unique unique (profile_id);

alter table public.instructeurs
  add constraint instructeurs_profile_id_unique unique (profile_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists set_instructeurs_updated_at on public.instructeurs;
create trigger set_instructeurs_updated_at
before update on public.instructeurs
for each row execute procedure public.set_updated_at();

create or replace function public.handle_profile_role_records()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.rol = 'leerling' then
    insert into public.leerlingen (profile_id)
    values (new.id)
    on conflict (profile_id) do nothing;
  end if;

  if new.rol = 'instructeur' then
    insert into public.instructeurs (
      profile_id,
      slug,
      bio,
      werkgebied,
      profiel_status
    )
    values (
      new.id,
      concat('instructeur-', left(new.id::text, 8)),
      '',
      '{}',
      'in_beoordeling'
    )
    on conflict (profile_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_profile_created_role_records on public.profiles;
create trigger on_profile_created_role_records
after insert on public.profiles
for each row execute procedure public.handle_profile_role_records();

create policy "Eigen profiel invoegen toegestaan"
on public.profiles
for insert
with check (auth.uid() = id);

create policy "Eigen leerlingrecord lezen"
on public.leerlingen
for select
using (
  profile_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.rol = 'admin'
  )
);

create policy "Eigen leerlingrecord invoegen"
on public.leerlingen
for insert
with check (profile_id = auth.uid());

create policy "Eigen leerlingrecord bijwerken"
on public.leerlingen
for update
using (profile_id = auth.uid());

create policy "Publieke instructeursprofielen lezen"
on public.profiles
for select
using (
  exists (
    select 1 from public.instructeurs i
    where i.profile_id = profiles.id
  )
  or auth.uid() = id
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.rol = 'admin'
  )
);

create policy "Eigen instructeurrecord lezen"
on public.instructeurs
for select
using (
  true
  or profile_id = auth.uid()
);

create policy "Eigen instructeurrecord invoegen"
on public.instructeurs
for insert
with check (profile_id = auth.uid());

create policy "Eigen instructeurrecord bijwerken"
on public.instructeurs
for update
using (
  profile_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.rol = 'admin'
  )
);

create policy "Leerling mag eigen lesaanvragen lezen"
on public.lesaanvragen
for select
using (
  exists (
    select 1 from public.leerlingen l
    where l.id = lesaanvragen.leerling_id and l.profile_id = auth.uid()
  )
  or exists (
    select 1 from public.instructeurs i
    where i.id = lesaanvragen.instructeur_id and i.profile_id = auth.uid()
  )
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.rol = 'admin'
  )
);

create policy "Leerling mag eigen lesaanvragen invoegen"
on public.lesaanvragen
for insert
with check (
  exists (
    select 1 from public.leerlingen l
    where l.id = lesaanvragen.leerling_id and l.profile_id = auth.uid()
  )
);

create policy "Instructeur of admin mag lesaanvraag bijwerken"
on public.lesaanvragen
for update
using (
  exists (
    select 1 from public.instructeurs i
    where i.id = lesaanvragen.instructeur_id and i.profile_id = auth.uid()
  )
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.rol = 'admin'
  )
);

create policy "Publieke reviews lezen"
on public.reviews
for select
using (true);

create policy "Publieke beschikbaarheid lezen"
on public.beschikbaarheid
for select
using (beschikbaar = true);
