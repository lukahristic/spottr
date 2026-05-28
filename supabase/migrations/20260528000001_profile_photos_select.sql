-- ============================================================================
-- Profile photos — add the missing SELECT policy
--
-- Followup to 20260527000002_profile_photos.sql. That migration assumed the
-- bucket's `public = true` flag would handle reads, and skipped a SELECT
-- policy on storage.objects. That's true for end-user reads through the
-- /object/public/ URL — but storage-api's DELETE and UPDATE flows still need
-- to SELECT the row through normal RLS to confirm it exists before acting on
-- it. Without a SELECT policy, RLS hides the row, storage-api believes
-- there's nothing to delete (returns 200, doesn't actually delete), and the
-- next INSERT fails with "resource already exists".
--
-- Scoped to the owner's own folder so this doesn't let users enumerate
-- anyone else's photos.
-- ============================================================================

drop policy if exists "profile photo read — owner only" on storage.objects;

create policy "profile photo read — owner only"
on storage.objects for select
to authenticated
using (
  bucket_id = 'profile-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
