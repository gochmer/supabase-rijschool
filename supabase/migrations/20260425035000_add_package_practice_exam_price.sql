alter table public.pakketten
add column if not exists praktijk_examen_prijs numeric(10,2);

alter table public.pakketten
drop constraint if exists pakketten_praktijk_examen_prijs_check;

alter table public.pakketten
add constraint pakketten_praktijk_examen_prijs_check
check (praktijk_examen_prijs is null or praktijk_examen_prijs >= 0);
