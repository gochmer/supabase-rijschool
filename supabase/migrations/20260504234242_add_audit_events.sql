create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  actor_profile_id uuid references public.profiles(id) on delete set null,
  actor_role text not null default 'system',
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  leerling_id uuid references public.leerlingen(id) on delete set null,
  instructeur_id uuid references public.instructeurs(id) on delete set null,
  pakket_id uuid references public.pakketten(id) on delete set null,
  betaling_id uuid references public.betalingen(id) on delete set null,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  constraint audit_events_actor_role_check
    check (actor_role in ('admin', 'instructeur', 'leerling', 'system')),
  constraint audit_events_event_type_not_blank_check
    check (length(trim(event_type)) > 0),
  constraint audit_events_entity_type_not_blank_check
    check (length(trim(entity_type)) > 0),
  constraint audit_events_summary_not_blank_check
    check (length(trim(summary)) > 0),
  constraint audit_events_metadata_object_check
    check (jsonb_typeof(metadata) = 'object')
);

comment on table public.audit_events is
  'Immutable application audit trail for sensitive student, package, planning and payment actions.';
comment on column public.audit_events.actor_profile_id is
  'Profile that initiated the action. Null means system/service action or deleted actor.';
comment on column public.audit_events.event_type is
  'Machine-readable action name, for example package_assigned or package_payment_closed.';
comment on column public.audit_events.metadata is
  'Structured non-authoritative context for support and debugging.';

create index if not exists audit_events_leerling_created_at_idx
on public.audit_events (leerling_id, created_at desc);

create index if not exists audit_events_instructeur_created_at_idx
on public.audit_events (instructeur_id, created_at desc);

create index if not exists audit_events_actor_created_at_idx
on public.audit_events (actor_profile_id, created_at desc);

create index if not exists audit_events_event_type_created_at_idx
on public.audit_events (event_type, created_at desc);

create index if not exists audit_events_pakket_created_at_idx
on public.audit_events (pakket_id, created_at desc);

create index if not exists audit_events_betaling_created_at_idx
on public.audit_events (betaling_id, created_at desc);

alter table public.audit_events enable row level security;

grant select on public.audit_events to authenticated;
grant insert, update, delete on public.audit_events to authenticated;

drop policy if exists "Audit events lezen voor betrokken gebruikers"
on public.audit_events;
create policy "Audit events lezen voor betrokken gebruikers"
on public.audit_events
for select
using (
  private.is_current_user_admin()
  or (
    leerling_id is not null
    and exists (
      select 1
      from public.leerlingen l
      where l.id = audit_events.leerling_id
        and l.profile_id = (select auth.uid())
    )
  )
  or (
    instructeur_id is not null
    and exists (
      select 1
      from public.instructeurs i
      where i.id = audit_events.instructeur_id
        and i.profile_id = (select auth.uid())
    )
  )
  or (
    leerling_id is not null
    and private.can_current_instructor_access_learner(leerling_id)
  )
);

drop policy if exists "Admin kan audit events beheren"
on public.audit_events;
create policy "Admin kan audit events beheren"
on public.audit_events
for all
using (private.is_current_user_admin())
with check (private.is_current_user_admin());
