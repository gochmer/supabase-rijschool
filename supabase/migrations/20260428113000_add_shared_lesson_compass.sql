create table if not exists public.leskompassen (
  id uuid primary key default gen_random_uuid(),
  leerling_id uuid not null references public.leerlingen(id) on delete cascade,
  instructeur_id uuid not null references public.instructeurs(id) on delete cascade,
  instructeur_focus text,
  instructeur_missie text,
  leerling_confidence smallint,
  leerling_hulpvraag text,
  laatste_update_door text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leskompassen_pair_key unique (leerling_id, instructeur_id),
  constraint leskompassen_confidence_check check (
    leerling_confidence is null
    or leerling_confidence between 1 and 5
  ),
  constraint leskompassen_last_actor_check check (
    laatste_update_door is null
    or laatste_update_door in ('leerling', 'instructeur')
  )
);

comment on table public.leskompassen is
  'Gedeeld live leskompas tussen leerling en instructeur voor coachfocus, check-ins en volgende lesafstemming.';

comment on column public.leskompassen.instructeur_focus is
  'Korte focus die de instructeur voor de volgende les of komende fase meegeeft.';

comment on column public.leskompassen.instructeur_missie is
  'Compacte mini-missie of huiswerkactie die de leerling tussen twee lessen kan oppakken.';

comment on column public.leskompassen.leerling_confidence is
  'Zelfvertrouwen van de leerling op een schaal van 1 tot en met 5.';

comment on column public.leskompassen.leerling_hulpvraag is
  'Waar de leerling nu hulp op wil of waar hij of zij op vastloopt.';

comment on column public.leskompassen.laatste_update_door is
  'Houdt bij of de laatste betekenisvolle update van leerling of instructeur kwam.';

create index if not exists leskompassen_instructeur_idx
on public.leskompassen (instructeur_id, updated_at desc);

create index if not exists leskompassen_leerling_idx
on public.leskompassen (leerling_id, updated_at desc);

alter table public.leskompassen enable row level security;

drop policy if exists "Gekoppelde gebruiker kan leskompas lezen" on public.leskompassen;
drop policy if exists "Gekoppelde gebruiker kan leskompas toevoegen" on public.leskompassen;
drop policy if exists "Gekoppelde gebruiker kan leskompas bijwerken" on public.leskompassen;

create policy "Gekoppelde gebruiker kan leskompas lezen"
on public.leskompassen
for select
using (
  private.is_current_user_admin()
  or private.can_current_instructor_access_learner(leerling_id)
  or private.can_current_learner_access_instructor(instructeur_id)
);

create policy "Gekoppelde gebruiker kan leskompas toevoegen"
on public.leskompassen
for insert
with check (
  private.is_current_user_admin()
  or (
    exists (
      select 1
      from public.instructeurs i
      where i.id = leskompassen.instructeur_id
        and i.profile_id = auth.uid()
    )
    and private.can_current_instructor_access_learner(leerling_id)
  )
  or (
    exists (
      select 1
      from public.leerlingen l
      where l.id = leskompassen.leerling_id
        and l.profile_id = auth.uid()
    )
    and private.can_current_learner_access_instructor(instructeur_id)
  )
);

create policy "Gekoppelde gebruiker kan leskompas bijwerken"
on public.leskompassen
for update
using (
  private.is_current_user_admin()
  or (
    exists (
      select 1
      from public.instructeurs i
      where i.id = leskompassen.instructeur_id
        and i.profile_id = auth.uid()
    )
    and private.can_current_instructor_access_learner(leerling_id)
  )
  or (
    exists (
      select 1
      from public.leerlingen l
      where l.id = leskompassen.leerling_id
        and l.profile_id = auth.uid()
    )
    and private.can_current_learner_access_instructor(instructeur_id)
  )
)
with check (
  private.is_current_user_admin()
  or (
    exists (
      select 1
      from public.instructeurs i
      where i.id = leskompassen.instructeur_id
        and i.profile_id = auth.uid()
    )
    and private.can_current_instructor_access_learner(leerling_id)
  )
  or (
    exists (
      select 1
      from public.leerlingen l
      where l.id = leskompassen.leerling_id
        and l.profile_id = auth.uid()
    )
    and private.can_current_learner_access_instructor(instructeur_id)
  )
);

drop trigger if exists set_leskompassen_updated_at on public.leskompassen;
create trigger set_leskompassen_updated_at
before update on public.leskompassen
for each row execute function public.set_updated_at();

do $$
begin
  if not exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) then
    execute 'create publication supabase_realtime';
  end if;

  begin
    alter publication supabase_realtime add table public.leskompassen;
  exception
    when duplicate_object then
      null;
  end;
end
$$;
