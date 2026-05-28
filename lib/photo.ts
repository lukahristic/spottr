import { supabase } from './supabase'

/*
 * Upload a profile photo (from a local Expo Camera URI) to Supabase Storage
 * and update the user's profiles row with the resulting URL.
 *
 * The path inside the bucket is constant — {user_id}/avatar.jpg — so re-uploads
 * overwrite. To bust caches across clients, the public URL we store on the
 * profile includes a ?v=<timestamp> query string that changes on each upload.
 *
 * Why FormData + supabase-js (and not a hand-rolled fetch)
 * ────────────────────────────────────────────────────────
 * Two earlier approaches both failed in React Native:
 *
 *   1. supabase.storage.upload(path, blob) where blob came from
 *      fetch(uri).blob() or arrayBuffer() — RN's runtime drops the binary
 *      when supabase-js wraps it. Server gets 0 bytes → 400.
 *
 *   2. Hand-rolled fetch() POST to /storage/v1/object/... with FormData and
 *      manually-set Authorization + apikey headers — on Android the native
 *      okhttp layer that handles multipart-with-file-uri rebuilds the
 *      request and silently drops the Authorization header. Server treats
 *      the request as anon → auth.uid() is NULL → RLS denies INSERT → 403.
 *
 * The fix: build FormData with the RN file-shape object (the only binary
 * form that survives the JS↔native bridge intact) AND let supabase-js own
 * the auth headers. supabase-js accepts FormData as a body type and
 * attaches Authorization + apikey via its internal request layer, so the
 * JWT actually reaches Storage and auth.uid() resolves for RLS.
 *
 * Returns the new URL on success, or an error message string on failure.
 */
export async function uploadProfilePhoto(
  localUri: string
): Promise<{ url: string; uploadedAt: string } | { error: string }> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return { error: 'Sign in first.' }
  const userId = session.user.id

  const path = `${userId}/avatar.jpg`

  // RN FormData with the file-shape object — this is the only form of
  // binary upload that survives the JS-to-native bridge intact.
  const formData = new FormData()
  formData.append('file', {
    uri: localUri,
    name: 'avatar.jpg',
    type: 'image/jpeg',
  } as unknown as Blob)

  // Clean INSERT path: remove any prior object first, then upload without
  // upsert. The upsert: true flag causes storage-api to switch to an
  // INSERT...ON CONFLICT DO UPDATE pathway that evaluates BOTH the INSERT
  // policy AND the UPDATE policy — and storage-api's UPDATE branch was
  // failing our RLS check in a way that's invisible through standard SQL
  // diagnostics. By deleting any prior object first and doing a plain
  // INSERT, only the INSERT policy needs to pass.
  await supabase.storage.from('profile-photos').remove([path])

  const { error: uploadError } = await supabase.storage
    .from('profile-photos')
    .upload(path, formData as unknown as File, {
      contentType: 'image/jpeg',
    })

  if (uploadError) {
    console.error('[photo] Upload failed:', uploadError.message)
    return { error: 'Upload failed. Try again.' }
  }

  // Build the public URL with a cache-busting timestamp.
  const { data: { publicUrl } } = supabase.storage
    .from('profile-photos')
    .getPublicUrl(path)

  const uploadedAt = new Date().toISOString()
  const versionedUrl = `${publicUrl}?v=${Date.parse(uploadedAt)}`

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      photo_url: versionedUrl,
      photo_uploaded_at: uploadedAt,
    })
    .eq('id', userId)

  if (profileError) {
    console.error('[photo] Profile update failed:', profileError.message)
    return { error: 'Saved the photo but profile update failed. Try again.' }
  }

  return { url: versionedUrl, uploadedAt }
}

/*
 * Remove the user's photo from storage and clear the URL on their profile.
 * Useful for a "remove photo" action and for delete-account cleanup.
 */
export async function removeProfilePhoto(): Promise<{ ok: true } | { error: string }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sign in first.' }

  const path = `${user.id}/avatar.jpg`

  // Best-effort delete; if the file doesn't exist, we still clear the URL.
  await supabase.storage.from('profile-photos').remove([path])

  const { error } = await supabase
    .from('profiles')
    .update({ photo_url: null, photo_uploaded_at: null })
    .eq('id', user.id)

  if (error) return { error: "Couldn't update your profile. Try again." }
  return { ok: true }
}
