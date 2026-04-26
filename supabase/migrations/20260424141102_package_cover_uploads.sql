alter table public.pakketten
add column if not exists cover_path text;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'package-covers',
  'package-covers',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Package covers upload by instructors and admins" on storage.objects;
drop policy if exists "Package covers update by instructors and admins" on storage.objects;
drop policy if exists "Package covers delete by instructors and admins" on storage.objects;

create policy "Package covers upload by instructors and admins"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'package-covers'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.rol in ('admin', 'instructeur')
  )
);

create policy "Package covers update by instructors and admins"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'package-covers'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'package-covers'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.rol in ('admin', 'instructeur')
  )
);

create policy "Package covers delete by instructors and admins"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'package-covers'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.rol in ('admin', 'instructeur')
  )
);
