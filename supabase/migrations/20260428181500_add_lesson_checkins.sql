create table if not exists public.les_checkins (
  id uuid primary key default gen_random_uuid(),
  les_id uuid not null references public.lessen(id) on delete cascade,
  leerling_id uuid not null references public.leerlingen(id) on delete cascade,
  instructeur_id uuid not null references public.instructeurs(id) on delete cascade,
  confidence_level smallint check (confidence_level between 1 and 5),
  support_request text,
  arrival_mode text check (arrival_mode in ('op_tijd', 'afstemmen')),
  instructor_focus text,
  learner_updated_at timestamptz,
  instructor_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (les_id)
);

create index if not exists les_checkins_leerling_idx
on public.les_checkins (leerling_id, learner_updated_at desc);

create index if not exists les_checkins_instructeur_idx
on public.les_checkins (instructeur_id, instructor_updated_at desc);

alter table public.les_checkins enable row level security;

drop policy if exists "Leerling mag eigen les check-ins lezen" on public.les_checkins;
create policy "Leerling mag eigen les check-ins lezen"
on public.les_checkins
for select
to authenticated
using (
  exists (
    select 1
    from public.leerlingen l
    where l.id = les_checkins.leerling_id
      and l.profile_id = (select auth.uid())
  )
);

drop policy if exists "Leerling mag eigen les check-ins beheren" on public.les_checkins;
create policy "Leerling mag eigen les check-ins beheren"
on public.les_checkins
for insert
to authenticated
with check (
  exists (
    select 1
    from public.leerlingen l
    where l.id = les_checkins.leerling_id
      and l.profile_id = (select auth.uid())
  )
);

drop policy if exists "Leerling mag eigen les check-ins bijwerken" on public.les_checkins;
create policy "Leerling mag eigen les check-ins bijwerken"
on public.les_checkins
for update
to authenticated
using (
  exists (
    select 1
    from public.leerlingen l
    where l.id = les_checkins.leerling_id
      and l.profile_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.leerlingen l
    where l.id = les_checkins.leerling_id
      and l.profile_id = (select auth.uid())
  )
);

drop policy if exists "Instructeur mag eigen les check-ins lezen" on public.les_checkins;
create policy "Instructeur mag eigen les check-ins lezen"
on public.les_checkins
for select
to authenticated
using (
  exists (
    select 1
    from public.instructeurs i
    where i.id = les_checkins.instructeur_id
      and i.profile_id = (select auth.uid())
  )
);

drop policy if exists "Instructeur mag eigen les check-ins beheren" on public.les_checkins;
create policy "Instructeur mag eigen les check-ins beheren"
on public.les_checkins
for insert
to authenticated
with check (
  exists (
    select 1
    from public.instructeurs i
    where i.id = les_checkins.instructeur_id
      and i.profile_id = (select auth.uid())
  )
);

drop policy if exists "Instructeur mag eigen les check-ins bijwerken" on public.les_checkins;
create policy "Instructeur mag eigen les check-ins bijwerken"
on public.les_checkins
for update
to authenticated
using (
  exists (
    select 1
    from public.instructeurs i
    where i.id = les_checkins.instructeur_id
      and i.profile_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.instructeurs i
    where i.id = les_checkins.instructeur_id
      and i.profile_id = (select auth.uid())
  )
);

drop policy if exists "Admin kan alle les check-ins beheren" on public.les_checkins;
create policy "Admin kan alle les check-ins beheren"
on public.les_checkins
for all
to authenticated
using (private.is_current_user_admin())
with check (private.is_current_user_admin());

drop trigger if exists set_lesson_checkins_updated_at on public.les_checkins;
create trigger set_lesson_checkins_updated_at
before update on public.les_checkins
for each row execute function public.set_updated_at();

alter publication supabase_realtime add table public.les_checkins;
