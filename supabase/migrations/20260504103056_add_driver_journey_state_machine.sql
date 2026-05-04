alter table public.leerlingen
add column if not exists student_status text not null default 'onboarding',
add column if not exists student_status_updated_at timestamptz not null default now(),
add column if not exists student_status_reason text;

alter table public.leerlingen
drop constraint if exists leerlingen_student_status_check;

alter table public.leerlingen
add constraint leerlingen_student_status_check
check (
  student_status in (
    'onboarding',
    'pakket_kiezen',
    'lessen',
    'examen_klaar',
    'examen_gepland',
    'geslaagd'
  )
);

create index if not exists leerlingen_student_status_idx
on public.leerlingen (student_status);

create index if not exists leerlingen_student_status_updated_at_idx
on public.leerlingen (student_status_updated_at desc);
