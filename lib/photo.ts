import { supabase } from './supabase'

/*
 * Upload a profile photo (from a local Expo Camera URI) to Supabase Storage
 * and update the user's profiles row with the resulting URL.
 *
 * The path inside the bucket is constant — {user_id}/avatar.jpg — so re-uploads
 * overwrite. To bust caches across clients, the public URL we store on the
 * profile includes a ?v=<timestamp> query string that changes on each upload.
 *
 * Returns the new URL on success, or an error message string on failure.
 * Callers should treat any return value other than { url, uploadedAt } as
 * a failure to render to the user.
 */
export async function uploadProfilePhoto(
  localUri: string
): Promise<{ url: string; uploadedAt: string } | { error: string }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sign in first.' }

  /*
   * RN's fetch handles local file URIs (file://...) and returns a body we
   * can read as a blob. Supabase Storage accepts a blob directly. This is
   * the simplest path that avoids pulling in expo-file-system or base64
   * encoding helpers.
   */
  let blob: Blob
  try {
    const response = await fetch(localUri)
    blob = await response.blob()
  } catch {
    return { error: "Couldn't read the photo. Try again." }
  }

  const path = `${user.id}/avatar.jpg`

  const { error: uploadError } = await supabase.storage
    .from('profile-photos')
    .upload(path, blob, {
      contentType: 'image/jpeg',
      upsert: true,           // overwrite previous photo at the same path
      cacheControl: '3600',   // short cache; we still bust via ?v= below
    })

  if (uploadError) {
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
    .eq('id', user.id)

  if (profileError) {
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
