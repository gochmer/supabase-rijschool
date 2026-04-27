alter table public.reviews
  add column if not exists moderatie_notitie text,
  add column if not exists moderated_by uuid references public.profiles (id) on delete set null;

comment on column public.reviews.moderatie_notitie is
  'Interne adminnotitie voor reviewmoderatie en opvolging.';

comment on column public.reviews.moderated_by is
  'Admin-profiel dat de laatste moderatie-update heeft uitgevoerd.';
