create table if not exists public.instructeur_feedback_templates (
  id uuid primary key default gen_random_uuid(),
  instructeur_id uuid not null references public.instructeurs(id) on delete cascade,
  vaardigheid_key text,
  status text check (
    status is null
    or status in ('uitleg', 'begeleid', 'zelfstandig', 'herhaling')
  ),
  target text not null check (
    target in ('samenvatting', 'sterkPunt', 'focusVolgendeLes')
  ),
  label text not null,
  tekst text not null,
  actief boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.instructeur_feedback_templates is
  'Eigen feedbacktemplates per instructeur, optioneel gekoppeld aan een voortgangsskill en status.';

comment on column public.instructeur_feedback_templates.target is
  'Bepaalt in welk feedbackveld de template wordt ingevoegd: samenvatting, sterkPunt of focusVolgendeLes.';

create index if not exists instructeur_feedback_templates_lookup_idx
on public.instructeur_feedback_templates (
  instructeur_id,
  actief,
  vaardigheid_key,
  status,
  sort_order,
  created_at desc
);

create index if not exists instructeur_feedback_templates_instructeur_idx
on public.instructeur_feedback_templates (instructeur_id, created_at desc);

alter table public.instructeur_feedback_templates enable row level security;

drop policy if exists "Instructeur kan eigen feedbacktemplates lezen"
on public.instructeur_feedback_templates;
create policy "Instructeur kan eigen feedbacktemplates lezen"
on public.instructeur_feedback_templates
for select
using (
  exists (
    select 1
    from public.instructeurs i
    where i.id = instructeur_feedback_templates.instructeur_id
      and i.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.rol = 'admin'
  )
);

drop policy if exists "Instructeur kan eigen feedbacktemplates aanmaken"
on public.instructeur_feedback_templates;
create policy "Instructeur kan eigen feedbacktemplates aanmaken"
on public.instructeur_feedback_templates
for insert
with check (
  exists (
    select 1
    from public.instructeurs i
    where i.id = instructeur_feedback_templates.instructeur_id
      and i.profile_id = (select auth.uid())
  )
);

drop policy if exists "Instructeur kan eigen feedbacktemplates aanpassen"
on public.instructeur_feedback_templates;
create policy "Instructeur kan eigen feedbacktemplates aanpassen"
on public.instructeur_feedback_templates
for update
using (
  exists (
    select 1
    from public.instructeurs i
    where i.id = instructeur_feedback_templates.instructeur_id
      and i.profile_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.instructeurs i
    where i.id = instructeur_feedback_templates.instructeur_id
      and i.profile_id = (select auth.uid())
  )
);

drop policy if exists "Instructeur kan eigen feedbacktemplates verwijderen"
on public.instructeur_feedback_templates;
create policy "Instructeur kan eigen feedbacktemplates verwijderen"
on public.instructeur_feedback_templates
for delete
using (
  exists (
    select 1
    from public.instructeurs i
    where i.id = instructeur_feedback_templates.instructeur_id
      and i.profile_id = (select auth.uid())
  )
);
