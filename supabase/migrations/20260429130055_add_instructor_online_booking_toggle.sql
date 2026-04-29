alter table public.instructeurs
  add column if not exists online_boeken_actief boolean not null default false;

comment on column public.instructeurs.online_boeken_actief is
  'Wanneer dit aanstaat kunnen leerlingen via de publieke instructeurpagina online zelf een vrij agenda-moment kiezen.';
