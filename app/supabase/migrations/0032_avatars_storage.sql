-- =============================================================================
-- Temp Platform — Avatar uploads via Supabase Storage.
--
-- Public-read 'avatars' bucket. Any authenticated user may upload/replace/
-- delete objects under a path prefixed with their own user id (uid/filename),
-- so a user can only touch their own avatar files. Public read lets <img> show
-- them without signed URLs.
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- Public read of avatar objects.
drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- A user may write/replace/delete only within their own uid/ prefix.
drop policy if exists "avatars user write" on storage.objects;
create policy "avatars user write"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars user update" on storage.objects;
create policy "avatars user update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars user delete" on storage.objects;
create policy "avatars user delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
