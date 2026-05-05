alter table public.instructeur_feedback_templates
add column if not exists note_type text not null default 'algemene_begeleiding',
add column if not exists omschrijving text;

alter table public.instructeur_feedback_templates
drop constraint if exists instructeur_feedback_templates_note_type_check;

alter table public.instructeur_feedback_templates
add constraint instructeur_feedback_templates_note_type_check
check (
  note_type in (
    'voortgangsnotitie',
    'lesfeedback',
    'gedragsobservatie',
    'examenvoorbereiding',
    'motivatiegesprek',
    'aandachtspunt',
    'algemene_begeleiding'
  )
);

comment on column public.instructeur_feedback_templates.note_type is
  'Type coachnotitie waarvoor deze template bedoeld is.';

comment on column public.instructeur_feedback_templates.omschrijving is
  'Korte uitleg voor coaches wanneer deze template handig is.';

create index if not exists instructeur_feedback_templates_note_type_idx
on public.instructeur_feedback_templates (
  instructeur_id,
  actief,
  note_type,
  sort_order,
  created_at desc
);
