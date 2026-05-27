import { supabase } from './supabase'

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!

/*
 * Upload a profile photo (from a local Expo Camera URI) to Supabase Storage
 * and update the user's profiles row with the resulting URL.
 *
 * The path inside the bucket is constant — {user_id}/avatar.jpg — so re-uploads
 * overwrite. To bust caches across clients, the public URL we store on the
 * profile includes a ?v=<timestamp> query string that changes on each upload.
 *
 * Why we don't use supabase.storage.upload() here
 * ────────────────────────────────────────────────
 * Both blob() and arrayBuffer() built from an Expo Camera file:// URI produce
 * a 0-byte multipart body inside React Native (the runtime's Blob/Buffer
 * implementation drops the binary when supabase-js wraps it for the request).
 * The server sees an empty body and returns 400.
 *
 * The reliable RN pattern is to POST directly to the Storage REST endpoint
 * with multipart FormData using the { uri, name, type } shape — RN's own
 * FormData implementation handles this natively on both iOS and Android and
 * produces a proper multipart payload. We let fetch set the Content-Type
 * boundary automatically.
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

  let uploadResponse: Response
  try {
    uploadResponse = await fetch(
      `${SUPABASE_URL}/storage/v1/object/profile-photos/${path}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          // x-upsert lets us overwrite the existing avatar.jpg at the same path.
          'x-upsert': 'true',
          // Intentionally NOT setting Content-Type — fetch will set
          // 'multipart/form-data; boundary=...' for us. Setting it manually
          // here strips the boundary and the request becomes unparseable.
        },
        body: formData,
      }
    )
  } catch (err) {
    console.error('[photo] Network error during upload:', String(err))
    return { error: "Couldn't reach the server. Check your connection." }
  }

  if (!uploadResponse.ok) {
    const errorBody = await uploadResponse.text().catch(() => '')
    console.error('[photo] Upload failed:', uploadResponse.status, errorBody)
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
