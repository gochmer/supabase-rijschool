alter table public.instructeur_feedback_templates
add column if not exists usage_count integer not null default 0,
add column if not exists last_used_at timestamptz;

comment on column public.instructeur_feedback_templates.usage_count is
  'Aantal keren dat een instructeur deze template heeft ingevoegd in een feedbackflow.';

comment on column public.instructeur_feedback_templates.last_used_at is
  'Laatste moment waarop deze template is ingevoegd in een feedbackflow.';

create index if not exists instructeur_feedback_templates_usage_idx
on public.instructeur_feedback_templates (
  instructeur_id,
  actief,
  usage_count desc,
  last_used_at desc
);
