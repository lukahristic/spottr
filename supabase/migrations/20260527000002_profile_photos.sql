-- ============================================================================
-- Real profile photos (roadmap item 1.3)
--
-- Camera-only selfie flow. Users tap "Add your photo" in the app, the camera
-- opens, they take a selfie, it uploads to the profile-photos bucket.
--
-- Public bucket: URLs work without auth. The trust model already gates user
-- visibility at the live-list query (same-gym only); adding signed URLs would
-- be defensive overkill at this stage. Revisit if photos ever leak in
-- unexpected ways.
-- ============================================================================

-- 1) Profile columns
alter table public.profiles
  add column if not exists photo_url text,
  add column if not exists photo_uploaded_at timestamptz;

comment on column public.profiles.photo_url is
  'Public URL to the user-uploaded selfie. Stored in profile-photos bucket at {user_id}/avatar.jpg. Null if the user has not uploaded one. The URL includes ?v=<timestamp> for cache busting on re-upload.';

comment on column public.profiles.photo_uploaded_at is
  'When the current photo was uploaded. Used for cache busting and audit.';

-- 2) Storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-photos',
  'profile-photos',
  true,                                         -- public reads via URL
  2097152,                                      -- 2 MB cap per photo
  array['image/jpeg', 'image/jpg', 'image/png']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 3) Storage RLS — users can only write to their own {user_id}/* path.
--    Drop-if-exists so this migration is re-runnable.
drop policy if exists "profile photo upload — owner only" on storage.objects;
drop policy if exists "profile photo update — owner only" on storage.objects;
drop policy if exists "profile photo delete — owner only" on storage.objects;

create policy "profile photo upload — owner only"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'profile-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "profile photo update — owner only"
on storage.objects for update
to authenticated
using (
  bucket_id = 'profile-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "profile photo delete — owner only"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'profile-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Public reads are handled by the bucket's public = true flag — no SELECT
-- policy needed. Anyone with the URL can fetch the file, which is the
-- intended behavior.
