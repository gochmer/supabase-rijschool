alter table public.instructeur_leerling_koppelingen
add column if not exists intake_checklist_keys text[] not null default '{}';
